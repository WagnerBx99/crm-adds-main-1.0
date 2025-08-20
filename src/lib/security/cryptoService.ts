/**
 * Serviço de Criptografia para dados sensíveis
 * 
 * Implementa criptografia AES-256-GCM para proteger dados sensíveis no banco de dados
 * e em trânsito quando necessário.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

interface EncryptedData {
  iv: string;       // Vetor de inicialização
  data: string;     // Dados criptografados
  tag: string;      // Tag de autenticação
  version: number;  // Versão do algoritmo (para migrações futuras)
}

export class CryptoService {
  private static instance: CryptoService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly saltLength = 16;
  private masterKey: Buffer | null = null;
  private keyVault: Map<string, Buffer> = new Map();
  
  // Chaves específicas para diferentes tipos de dados
  private readonly DATA_KEYS = {
    PERSONAL_INFO: 'personal_info_key',
    FINANCIAL: 'financial_data_key',
    DOCUMENTS: 'document_data_key',
    HEALTH: 'health_data_key'
  };
  
  private constructor() {
    // A chave mestra será carregada de uma variável de ambiente em produção
    // Em desenvolvimento, usamos uma chave padrão (NUNCA FAZER ISSO EM PRODUÇÃO)
    this.initializeMasterKey();
    this.initializeDataKeys();
  }
  
  /**
   * Obter instância única do serviço (Singleton)
   */
  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }
  
  /**
   * Inicializar chave mestra
   * Em produção, deve ser carregada de um serviço seguro de gerenciamento de chaves
   */
  private initializeMasterKey(): void {
    // Em um ambiente real, você usaria um serviço como AWS KMS, Azure Key Vault, etc.
    // Aqui está uma implementação simplificada para demonstração
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Em produção, a chave deve vir de uma variável de ambiente ou serviço de gerenciamento de chaves
      const masterKeyHex = process.env.CRYPTO_MASTER_KEY;
      
      if (!masterKeyHex) {
        throw new Error('Chave mestra de criptografia não definida no ambiente de produção');
      }
      
      try {
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
      } catch (error) {
        console.error('Erro ao carregar chave mestra:', error);
        throw new Error('Formato inválido para chave mestra de criptografia');
      }
    } else {
      // Em desenvolvimento, usamos uma chave fixa (APENAS PARA DESENVOLVIMENTO)
      // ALERTA: NUNCA use esta abordagem em produção!
      const devPassword = 'desenvolvimento-chave-insegura-nao-use-em-producao';
      const salt = randomBytes(this.saltLength);
      this.masterKey = scryptSync(devPassword, salt, this.keyLength);
      
      console.warn(
        'AVISO: Usando chave de desenvolvimento para criptografia. ' +
        'Esta configuração NÃO é segura para produção!'
      );
    }
  }
  
  /**
   * Inicializar chaves de dados derivadas da chave mestra
   * Cada tipo de dado sensível usa uma chave separada
   */
  private initializeDataKeys(): void {
    if (!this.masterKey) {
      throw new Error('Chave mestra não inicializada');
    }
    
    // Derivar chaves específicas para diferentes tipos de dados
    for (const keyName of Object.values(this.DATA_KEYS)) {
      // Usar o nome da chave como salt para derivar chaves diferentes
      const salt = Buffer.from(keyName, 'utf-8');
      const derivedKey = scryptSync(this.masterKey, salt, this.keyLength);
      this.keyVault.set(keyName, derivedKey);
    }
    
    console.log(`${this.keyVault.size} chaves de criptografia inicializadas`);
  }
  
  /**
   * Criptografar dados sensíveis
   * @param data Dados a serem criptografados
   * @param keyType Tipo de chave a ser usada (categoria de dados)
   * @returns Objeto com dados criptografados e metadados
   */
  public encrypt(data: string, keyType: keyof typeof this.DATA_KEYS): string {
    const keyName = this.DATA_KEYS[keyType];
    const key = this.keyVault.get(keyName);
    
    if (!key) {
      throw new Error(`Chave de criptografia não encontrada para: ${keyType}`);
    }
    
    // Gerar vetor de inicialização (IV) aleatório
    const iv = randomBytes(12); // 12 bytes é o tamanho recomendado para GCM
    
    // Criar cipher com key, iv e algoritmo
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    // Criptografar dados
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    // Obter tag de autenticação (importante para GCM)
    const tag = cipher.getAuthTag();
    
    // Criar objeto com todos os dados necessários para descriptografia
    const encryptedData: EncryptedData = {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: tag.toString('hex'),
      version: 1 // Versão do algoritmo para eventual migração futura
    };
    
    // Retornar JSON codificado em base64 para armazenamento seguro
    return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
  }
  
  /**
   * Descriptografar dados
   * @param encryptedBase64 Dados criptografados (em base64)
   * @param keyType Tipo de chave usada na criptografia
   * @returns Dados descriptografados
   */
  public decrypt(encryptedBase64: string, keyType: keyof typeof this.DATA_KEYS): string {
    try {
      // Decodificar o JSON com os dados criptografados
      const encryptedJson = Buffer.from(encryptedBase64, 'base64').toString('utf-8');
      const encryptedData: EncryptedData = JSON.parse(encryptedJson);
      
      // Verificar versão para compatibilidade
      if (encryptedData.version !== 1) {
        throw new Error(`Versão não suportada de dados criptografados: ${encryptedData.version}`);
      }
      
      // Obter a chave correta
      const keyName = this.DATA_KEYS[keyType];
      const key = this.keyVault.get(keyName);
      
      if (!key) {
        throw new Error(`Chave de criptografia não encontrada para: ${keyType}`);
      }
      
      // Converter IV e tag de volta para Buffer
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      // Criar decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag); // Importante para GCM
      
      // Descriptografar
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw new Error('Falha ao descriptografar dados. Os dados podem estar corrompidos ou a chave incorreta foi usada.');
    }
  }
  
  /**
   * Rotacionar chaves - importante para segurança a longo prazo
   * Em um sistema real, isso seria feito periodicamente
   */
  public rotateKeys(): void {
    // Em produção, isso envolveria um processo seguro de rotação de chaves
    // incluindo backup das chaves antigas para dados históricos
    
    console.log('Rotação de chaves iniciada');
    
    // Re-inicializar chaves
    this.initializeMasterKey();
    this.initializeDataKeys();
    
    console.log('Rotação de chaves concluída');
  }
  
  /**
   * Verificar se um dado está criptografado
   * @param data Dados a verificar
   * @returns true se os dados parecem estar criptografados
   */
  public isEncrypted(data: string): boolean {
    try {
      // Tentar decodificar os dados como base64
      const jsonStr = Buffer.from(data, 'base64').toString('utf-8');
      
      // Verificar se é um JSON válido com a estrutura esperada
      const parsed = JSON.parse(jsonStr);
      return (
        typeof parsed === 'object' &&
        parsed !== null &&
        'iv' in parsed &&
        'data' in parsed &&
        'tag' in parsed &&
        'version' in parsed
      );
    } catch (error) {
      // Se houver erro na decodificação ou parsing, não está criptografado
      return false;
    }
  }
  
  /**
   * Gerar uma nova chave mestra aleatória
   * Útil para configuração inicial do sistema
   * @returns Chave mestra em formato hexadecimal
   */
  public static generateMasterKey(): string {
    const masterKey = randomBytes(32); // 256 bits
    return masterKey.toString('hex');
  }
}

// Export instância única
export const cryptoService = CryptoService.getInstance(); 