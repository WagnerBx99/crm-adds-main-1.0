/**
 * Implementação segura de localStorage com criptografia
 * 
 * Este módulo fornece uma versão segura do localStorage que criptografa
 * os dados antes de armazená-los, protegendo informações sensíveis.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

class SecureLocalStorage {
  private readonly SECRET_KEY_NAME = '__secure_storage_key__';
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12; // para GCM
  private readonly AUTH_TAG_LENGTH = 16; // para GCM
  private masterKey: Buffer | null = null;
  
  constructor() {
    this.initializeMasterKey();
  }
  
  /**
   * Inicializar chave mestra para criptografia do localStorage
   */
  private initializeMasterKey(): void {
    try {
      // Verificar se já existe uma chave armazenada
      let storedKey = localStorage.getItem(this.SECRET_KEY_NAME);
      
      if (!storedKey) {
        // Se não existe, gerar nova chave
        // Usar senha padrão apenas para desenvolvimento (NUNCA fazer em produção)
        const devPassword = 'secure-local-storage-dev-only';
        const salt = randomBytes(this.SALT_LENGTH);
        const key = scryptSync(devPassword, salt, this.KEY_LENGTH).toString('hex');
        
        // Armazenar a chave (em produção, usar mecanismo mais seguro)
        localStorage.setItem(this.SECRET_KEY_NAME, key);
        storedKey = key;
        
        console.warn(
          'AVISO: Chave de segurança do localStorage gerada para desenvolvimento. ' +
          'Em produção, use um mecanismo seguro de armazenamento de chaves.'
        );
      }
      
      // Converter a chave para Buffer
      this.masterKey = Buffer.from(storedKey, 'hex');
    } catch (error) {
      console.error('Erro ao inicializar chave mestra do SecureLocalStorage:', error);
    }
  }
  
  /**
   * Criptografar dados
   * @param data Dados a serem criptografados
   * @returns Dados criptografados em formato base64
   */
  private encrypt(data: string): string {
    if (!this.masterKey) {
      throw new Error('SecureLocalStorage: Chave mestra não inicializada');
    }
    
    try {
      // Gerar IV aleatório
      const iv = randomBytes(this.IV_LENGTH);
      
      // Criar cipher
      const cipher = createCipheriv(this.ALGORITHM, this.masterKey, iv);
      
      // Criptografar dados
      let encrypted = cipher.update(data, 'utf-8', 'base64');
      encrypted += cipher.final('base64');
      
      // Obter tag de autenticação
      const authTag = cipher.getAuthTag();
      
      // Combinar IV, dados criptografados e tag em um único string
      // Formato: base64(iv) + ':' + base64(authTag) + ':' + base64(encryptedData)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw new Error('Falha ao criptografar dados para armazenamento');
    }
  }
  
  /**
   * Descriptografar dados
   * @param encryptedData Dados criptografados no formato do método encrypt()
   * @returns Dados descriptografados
   */
  private decrypt(encryptedData: string): string {
    if (!this.masterKey) {
      throw new Error('SecureLocalStorage: Chave mestra não inicializada');
    }
    
    try {
      // Separar as partes do dados criptografados
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Formato inválido de dados criptografados');
      }
      
      const [ivBase64, authTagBase64, encryptedBase64] = parts;
      
      // Converter de base64 para Buffer
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      
      // Criar decipher
      const decipher = createDecipheriv(this.ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      // Descriptografar
      let decrypted = decipher.update(encryptedBase64, 'base64', 'utf-8');
      decrypted += decipher.final('utf-8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw new Error('Falha ao descriptografar dados do armazenamento');
    }
  }
  
  /**
   * Armazenar item criptografado no localStorage
   * @param key Chave para armazenamento
   * @param value Valor a ser armazenado (criptografado)
   */
  public setItem(key: string, value: string): void {
    if (!key || !value) return;
    
    try {
      const encryptedValue = this.encrypt(value);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`Erro ao armazenar item seguro '${key}':`, error);
    }
  }
  
  /**
   * Recuperar e descriptografar item do localStorage
   * @param key Chave do item
   * @returns Valor descriptografado ou null se não existir
   */
  public getItem(key: string): string | null {
    try {
      const encryptedValue = localStorage.getItem(key);
      
      if (!encryptedValue) {
        return null;
      }
      
      return this.decrypt(encryptedValue);
    } catch (error) {
      console.error(`Erro ao recuperar item seguro '${key}':`, error);
      return null;
    }
  }
  
  /**
   * Remover item do localStorage
   * @param key Chave do item
   */
  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  
  /**
   * Limpar todos os itens do localStorage
   */
  public clear(): void {
    // Preservar a chave mestra
    const masterKey = localStorage.getItem(this.SECRET_KEY_NAME);
    
    localStorage.clear();
    
    // Restaurar a chave mestra
    if (masterKey) {
      localStorage.setItem(this.SECRET_KEY_NAME, masterKey);
    }
  }
  
  /**
   * Verificar se o localStorage está disponível
   */
  public isAvailable(): boolean {
    try {
      const testKey = '__test_secure_storage__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Rotacionar a chave mestra
   * Importante para segurança a longo prazo
   */
  public rotateMasterKey(): void {
    try {
      // Recuperar todos os dados existentes
      const items: Record<string, string> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key !== this.SECRET_KEY_NAME) {
          const value = this.getItem(key);
          if (value) {
            items[key] = value;
          }
        }
      }
      
      // Gerar nova chave mestra
      const salt = randomBytes(this.SALT_LENGTH);
      this.masterKey = randomBytes(this.KEY_LENGTH);
      
      // Armazenar nova chave
      localStorage.setItem(this.SECRET_KEY_NAME, this.masterKey.toString('hex'));
      
      // Re-criptografar todos os dados com a nova chave
      for (const [key, value] of Object.entries(items)) {
        this.setItem(key, value);
      }
      
      console.log('Chave mestra do SecureLocalStorage rotacionada com sucesso');
    } catch (error) {
      console.error('Erro ao rotacionar chave mestra:', error);
      throw new Error('Falha ao rotacionar chave mestra do SecureLocalStorage');
    }
  }
}

// Exportar instância única
export const secureLocalStorage = new SecureLocalStorage(); 