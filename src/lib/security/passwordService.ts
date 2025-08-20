/**
 * Serviço de Gerenciamento Seguro de Senhas
 * 
 * Implementa hashing seguro com bcrypt e sistema de histórico de senhas
 * para evitar reutilização de senhas anteriores.
 */

import * as bcrypt from 'bcryptjs';
import { cryptoService } from './cryptoService';

interface PasswordHistory {
  hash: string;
  createdAt: number;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // em dias
  historySize: number;
}

export class PasswordService {
  private static instance: PasswordService;
  
  // Configuração de rounds para o bcrypt (mais rounds = mais seguro, porém mais lento)
  private readonly BCRYPT_ROUNDS = 12;
  
  // Política padrão de senhas
  private readonly DEFAULT_POLICY: PasswordPolicy = {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // 90 dias
    historySize: 5  // Armazenar as últimas 5 senhas
  };
  
  private constructor() {}
  
  public static getInstance(): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService();
    }
    return PasswordService.instance;
  }
  
  /**
   * Gerar hash seguro para uma senha
   * @param password Senha em texto plano
   * @returns Hash da senha
   */
  public async hashPassword(password: string): Promise<string> {
    try {
      // Gerar salt aleatório e hash da senha
      const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      
      return hash;
    } catch (error) {
      console.error('Erro ao gerar hash de senha:', error);
      throw new Error('Falha ao processar senha');
    }
  }
  
  /**
   * Verificar se uma senha corresponde ao hash armazenado
   * @param password Senha em texto plano
   * @param hash Hash armazenado
   * @returns true se a senha corresponder ao hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  }
  
  /**
   * Verificar se a senha atende aos requisitos da política
   * @param password Senha a ser verificada
   * @param policy Política de senha (opcional, usa padrão se não fornecida)
   * @returns Objeto com resultado da validação e mensagens de erro
   */
  public validatePasswordStrength(
    password: string, 
    policy: Partial<PasswordPolicy> = {}
  ): { 
    isValid: boolean; 
    errors: string[] 
  } {
    // Mesclar política fornecida com a padrão
    const activePolicy = { ...this.DEFAULT_POLICY, ...policy };
    const errors: string[] = [];
    
    // Verificar comprimento mínimo
    if (password.length < activePolicy.minLength) {
      errors.push(`A senha deve ter pelo menos ${activePolicy.minLength} caracteres`);
    }
    
    // Verificar presença de letras maiúsculas
    if (activePolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    // Verificar presença de letras minúsculas
    if (activePolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    // Verificar presença de números
    if (activePolicy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    // Verificar presença de caracteres especiais
    if (activePolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Verificar se a senha está no histórico de senhas do usuário
   * @param password Senha em texto plano
   * @param passwordHistory Histórico de senhas do usuário
   * @returns true se a senha estiver no histórico
   */
  public async isPasswordInHistory(
    password: string, 
    passwordHistory: PasswordHistory[]
  ): Promise<boolean> {
    // Se não houver histórico, a senha não está nele
    if (!passwordHistory || passwordHistory.length === 0) {
      return false;
    }
    
    // Verificar cada hash no histórico
    for (const entry of passwordHistory) {
      const matches = await this.verifyPassword(password, entry.hash);
      if (matches) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Adicionar senha ao histórico do usuário
   * @param passwordHash Hash da senha a ser adicionada
   * @param currentHistory Histórico atual
   * @param maxSize Tamanho máximo do histórico (padrão: 5)
   * @returns Novo histórico atualizado
   */
  public addToPasswordHistory(
    passwordHash: string,
    currentHistory: PasswordHistory[] = [],
    maxSize: number = this.DEFAULT_POLICY.historySize
  ): PasswordHistory[] {
    // Criar entrada para o histórico
    const newEntry: PasswordHistory = {
      hash: passwordHash,
      createdAt: Date.now()
    };
    
    // Adicionar ao início do histórico
    const newHistory = [newEntry, ...currentHistory];
    
    // Limitar tamanho do histórico
    if (newHistory.length > maxSize) {
      return newHistory.slice(0, maxSize);
    }
    
    return newHistory;
  }
  
  /**
   * Criptografar histórico de senhas para armazenamento seguro
   * @param passwordHistory Histórico de senhas
   * @returns Histórico criptografado
   */
  public encryptPasswordHistory(passwordHistory: PasswordHistory[]): string {
    const historyJson = JSON.stringify(passwordHistory);
    return cryptoService.encrypt(historyJson, 'PERSONAL_INFO');
  }
  
  /**
   * Descriptografar histórico de senhas
   * @param encryptedHistory Histórico criptografado
   * @returns Histórico descriptografado
   */
  public decryptPasswordHistory(encryptedHistory: string): PasswordHistory[] {
    try {
      const historyJson = cryptoService.decrypt(encryptedHistory, 'PERSONAL_INFO');
      return JSON.parse(historyJson);
    } catch (error) {
      console.error('Erro ao descriptografar histórico de senhas:', error);
      return [];
    }
  }
  
  /**
   * Verificar se uma senha precisa ser alterada (expirou)
   * @param lastChangedTimestamp Timestamp da última alteração da senha
   * @param maxAgeDays Idade máxima em dias (padrão: política padrão)
   * @returns true se a senha expirou
   */
  public isPasswordExpired(
    lastChangedTimestamp: number, 
    maxAgeDays: number = this.DEFAULT_POLICY.maxAge
  ): boolean {
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    
    return (now - lastChangedTimestamp) > maxAgeMs;
  }
  
  /**
   * Gerar uma senha forte aleatória
   * @param length Comprimento da senha (padrão: 16)
   * @returns Senha gerada
   */
  public generateStrongPassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    // Garantir pelo menos um caractere de cada tipo
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Preencher o resto da senha
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Misturar os caracteres
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }
  
  /**
   * Obter política de senhas atual
   * @param customPolicy Customizações da política padrão
   * @returns Política de senhas completa
   */
  public getPasswordPolicy(customPolicy: Partial<PasswordPolicy> = {}): PasswordPolicy {
    return { ...this.DEFAULT_POLICY, ...customPolicy };
  }
}

// Exportar instância única
export const passwordService = PasswordService.getInstance(); 