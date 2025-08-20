/**
 * Utilitários para criptografia de dados no banco de dados
 * 
 * Este módulo fornece funções e utilitários para garantir que dados sensíveis
 * sejam criptografados antes de serem armazenados no banco de dados e
 * descriptografados quando recuperados.
 */

import { cryptoService } from './cryptoService';

// Tipos de dados que devem ser criptografados
interface SensitiveFields {
  [modelName: string]: {
    fields: string[];
    keyType: keyof typeof cryptoService['DATA_KEYS'];
  }
}

// Definição dos campos que devem ser criptografados por modelo
const SENSITIVE_FIELDS: SensitiveFields = {
  User: {
    fields: ['cpf', 'phone', 'address'],
    keyType: 'PERSONAL_INFO'
  },
  Customer: {
    fields: ['cpf', 'rg', 'phone', 'address', 'notes'],
    keyType: 'PERSONAL_INFO'
  },
  Payment: {
    fields: ['cardNumber', 'cardCVV', 'accountNumber', 'pixKey'],
    keyType: 'FINANCIAL'
  },
  Document: {
    fields: ['content', 'metadata'],
    keyType: 'DOCUMENTS'
  },
  HealthRecord: {
    fields: ['diagnosis', 'treatment', 'medication', 'notes'],
    keyType: 'HEALTH'
  }
};

/**
 * Verifica se um campo de um modelo específico deve ser criptografado
 * @param modelName Nome do modelo/tabela
 * @param fieldName Nome do campo
 * @returns true se o campo deve ser criptografado
 */
export function isSensitiveField(modelName: string, fieldName: string): boolean {
  if (!SENSITIVE_FIELDS[modelName]) {
    return false;
  }
  
  return SENSITIVE_FIELDS[modelName].fields.includes(fieldName);
}

/**
 * Obtém o tipo de chave a ser usado para um modelo específico
 * @param modelName Nome do modelo/tabela
 * @returns Tipo de chave ou undefined se o modelo não for sensível
 */
export function getKeyTypeForModel(
  modelName: string
): keyof typeof cryptoService['DATA_KEYS'] | undefined {
  if (!SENSITIVE_FIELDS[modelName]) {
    return undefined;
  }
  
  return SENSITIVE_FIELDS[modelName].keyType;
}

/**
 * Criptografa um valor se ele for sensível, baseado no modelo e campo
 * @param modelName Nome do modelo/tabela
 * @param fieldName Nome do campo
 * @param value Valor a ser possivelmente criptografado
 * @returns Valor criptografado ou o valor original
 */
export function encryptFieldIfSensitive(
  modelName: string,
  fieldName: string,
  value: any
): any {
  // Não criptografar valores null ou undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Verificar se o campo deve ser criptografado
  if (!isSensitiveField(modelName, fieldName)) {
    return value;
  }
  
  // Obter tipo de chave para o modelo
  const keyType = getKeyTypeForModel(modelName);
  
  if (!keyType) {
    return value;
  }
  
  // Converter valor para string se não for string
  const valueToEncrypt = typeof value === 'string' 
    ? value 
    : JSON.stringify(value);
  
  // Verificar se já está criptografado
  if (cryptoService.isEncrypted(valueToEncrypt)) {
    return valueToEncrypt;
  }
  
  // Criptografar valor
  return cryptoService.encrypt(valueToEncrypt, keyType);
}

/**
 * Descriptografa um valor se for sensível, baseado no modelo e campo
 * @param modelName Nome do modelo/tabela
 * @param fieldName Nome do campo
 * @param value Valor a ser possivelmente descriptografado
 * @returns Valor descriptografado ou o valor original
 */
export function decryptFieldIfSensitive(
  modelName: string,
  fieldName: string,
  value: any
): any {
  // Não processar valores null ou undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Verificar se o campo deve ser descriptografado
  if (!isSensitiveField(modelName, fieldName)) {
    return value;
  }
  
  // Obter tipo de chave para o modelo
  const keyType = getKeyTypeForModel(modelName);
  
  if (!keyType) {
    return value;
  }
  
  // Verificar se está criptografado
  if (typeof value === 'string' && cryptoService.isEncrypted(value)) {
    try {
      const decrypted = cryptoService.decrypt(value, keyType);
      
      // Tentar converter de volta para JSON, se possível
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        // Se não for JSON válido, retornar como string
        return decrypted;
      }
    } catch (error) {
      console.error(`Erro ao descriptografar campo ${fieldName} do modelo ${modelName}:`, error);
      return value; // Retornar valor original em caso de erro
    }
  }
  
  return value;
}

/**
 * Criptografar campos sensíveis em um objeto antes de armazená-lo no banco
 * @param modelName Nome do modelo/tabela
 * @param data Objeto com dados a serem armazenados
 * @returns Objeto com campos sensíveis criptografados
 */
export function encryptSensitiveData<T extends Record<string, any>>(modelName: string, data: T): T {
  if (!SENSITIVE_FIELDS[modelName]) {
    return data;
  }
  
  const encryptedData = { ...data } as T;
  
  for (const field of SENSITIVE_FIELDS[modelName].fields) {
    if (field in data && data[field as keyof T] !== null && data[field as keyof T] !== undefined) {
      // Usar keyof T e unknown para lidar com o tipo genérico
      const value = data[field as keyof T];
      (encryptedData as unknown as Record<string, any>)[field] = encryptFieldIfSensitive(modelName, field, value);
    }
  }
  
  return encryptedData;
}

/**
 * Descriptografar campos sensíveis em um objeto após recuperá-lo do banco
 * @param modelName Nome do modelo/tabela
 * @param data Objeto com dados recuperados
 * @returns Objeto com campos sensíveis descriptografados
 */
export function decryptSensitiveData<T extends Record<string, any>>(modelName: string, data: T): T {
  if (!SENSITIVE_FIELDS[modelName]) {
    return data;
  }
  
  const decryptedData = { ...data } as T;
  
  for (const field of SENSITIVE_FIELDS[modelName].fields) {
    if (field in data && data[field as keyof T] !== null && data[field as keyof T] !== undefined) {
      // Usar keyof T e unknown para lidar com o tipo genérico
      const value = data[field as keyof T];
      (decryptedData as unknown as Record<string, any>)[field] = decryptFieldIfSensitive(modelName, field, value);
    }
  }
  
  return decryptedData;
}

/**
 * Processar uma lista de objetos, descriptografando campos sensíveis em cada um
 * @param modelName Nome do modelo/tabela
 * @param dataList Lista de objetos recuperados
 * @returns Lista com objetos processados
 */
export function decryptSensitiveDataList<T extends Record<string, any>>(
  modelName: string, 
  dataList: T[]
): T[] {
  return dataList.map(item => decryptSensitiveData(modelName, item));
}

/**
 * Middleware para usar com ORMs como Prisma ou Sequelize
 * Intercepta operações de leitura/escrita para aplicar criptografia
 */
export const dbEncryptionMiddleware = {
  /**
   * Middleware para operações de criação
   * @param modelName Nome do modelo/tabela
   * @param data Dados a serem criados
   * @returns Dados processados
   */
  create: <T extends Record<string, any>>(modelName: string, data: T): T => {
    return encryptSensitiveData(modelName, data);
  },
  
  /**
   * Middleware para operações de atualização
   * @param modelName Nome do modelo/tabela
   * @param data Dados a serem atualizados
   * @returns Dados processados
   */
  update: <T extends Record<string, any>>(modelName: string, data: T): T => {
    return encryptSensitiveData(modelName, data);
  },
  
  /**
   * Middleware para operações de leitura
   * @param modelName Nome do modelo/tabela
   * @param data Dados lidos do banco
   * @returns Dados processados
   */
  read: <T extends Record<string, any>>(modelName: string, data: T | T[]): T | T[] => {
    if (Array.isArray(data)) {
      return decryptSensitiveDataList(modelName, data);
    }
    return decryptSensitiveData(modelName, data);
  }
};

/**
 * Exemplo de uso com um ORM ou operações CRUD básicas
 */
export const secureDatabase = {
  /**
   * Criar registro com criptografia de campos sensíveis
   * @param modelName Nome do modelo/tabela
   * @param data Dados a serem armazenados
   * @returns Promise com resultado da operação
   */
  async create<T extends Record<string, any>>(modelName: string, data: T): Promise<T> {
    const encryptedData = encryptSensitiveData(modelName, data);
    
    // Aqui seria a chamada para o ORM ou banco de dados
    // Ex: const result = await prisma[modelName].create({ data: encryptedData });
    const result = encryptedData; // Simulação
    
    return result;
  },
  
  /**
   * Atualizar registro com criptografia de campos sensíveis
   * @param modelName Nome do modelo/tabela
   * @param id ID do registro
   * @param data Dados a serem atualizados
   * @returns Promise com resultado da operação
   */
  async update<T extends Record<string, any>>(modelName: string, id: string | number, data: T): Promise<T> {
    const encryptedData = encryptSensitiveData(modelName, data);
    
    // Aqui seria a chamada para o ORM ou banco de dados
    // Ex: const result = await prisma[modelName].update({ where: { id }, data: encryptedData });
    const result = encryptedData; // Simulação
    
    return result;
  },
  
  /**
   * Recuperar registro descriptografando campos sensíveis
   * @param modelName Nome do modelo/tabela
   * @param id ID do registro
   * @returns Promise com resultado da operação
   */
  async findById<T extends Record<string, any>>(modelName: string, id: string | number): Promise<T | null> {
    // Aqui seria a chamada para o ORM ou banco de dados
    // Ex: const result = await prisma[modelName].findUnique({ where: { id } });
    const result = null; // Simulação
    
    if (!result) {
      return null;
    }
    
    return decryptSensitiveData(modelName, result as T);
  },
  
  /**
   * Listar registros descriptografando campos sensíveis
   * @param modelName Nome do modelo/tabela
   * @param filter Filtro para a consulta
   * @returns Promise com resultado da operação
   */
  async findMany<T extends Record<string, any>>(
    modelName: string, 
    filter: Record<string, any> = {}
  ): Promise<T[]> {
    // Aqui seria a chamada para o ORM ou banco de dados
    // Ex: const results = await prisma[modelName].findMany({ where: filter });
    const results: T[] = []; // Simulação
    
    return decryptSensitiveDataList(modelName, results);
  }
}; 