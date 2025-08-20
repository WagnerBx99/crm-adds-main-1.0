/**
 * Gerenciador de Chaves de Criptografia
 * 
 * Este módulo fornece ferramentas para gerenciar o ciclo de vida das chaves de criptografia,
 * incluindo armazenamento seguro, rotação e controle de acesso.
 * 
 * Em produção, deve ser integrado com um serviço de gerenciamento de chaves como
 * AWS KMS, Azure Key Vault ou Google Cloud KMS.
 */

import { randomBytes, createHash } from 'crypto';
import { secureLocalStorage } from './secureLocalStorage';

interface KeyMetadata {
  id: string;
  createdAt: number;
  rotatedAt?: number;
  version: number;
  algorithm: string;
  status: 'active' | 'rotating' | 'deprecated' | 'revoked';
  purpose: string;
}

class KeyManager {
  private static instance: KeyManager;
  private keys: Map<string, { key: string, metadata: KeyMetadata }> = new Map();
  private readonly STORAGE_PREFIX = 'key_mgr_';
  private readonly DEFAULT_ALGO = 'AES-256-GCM';
  
  private constructor() {
    this.loadKeysFromStorage();
  }
  
  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }
  
  /**
   * Carregar chaves do armazenamento seguro
   */
  private loadKeysFromStorage(): void {
    try {
      // Nesta implementação simplificada, usamos localStorage seguro
      // Em produção, deve-se usar um serviço de gerenciamento de chaves
      
      const keysIndex = secureLocalStorage.getItem(`${this.STORAGE_PREFIX}index`);
      
      if (keysIndex) {
        const keyIds: string[] = JSON.parse(keysIndex);
        
        for (const keyId of keyIds) {
          const keyData = secureLocalStorage.getItem(`${this.STORAGE_PREFIX}${keyId}`);
          
          if (keyData) {
            const { key, metadata } = JSON.parse(keyData);
            this.keys.set(keyId, { key, metadata });
          }
        }
        
        console.log(`${this.keys.size} chaves carregadas do armazenamento`);
      }
    } catch (error) {
      console.error('Erro ao carregar chaves do armazenamento:', error);
    }
  }
  
  /**
   * Salvar chaves no armazenamento seguro
   */
  private saveKeysToStorage(): void {
    try {
      const keyIds = Array.from(this.keys.keys());
      secureLocalStorage.setItem(`${this.STORAGE_PREFIX}index`, JSON.stringify(keyIds));
      
      for (const [keyId, { key, metadata }] of this.keys.entries()) {
        secureLocalStorage.setItem(
          `${this.STORAGE_PREFIX}${keyId}`, 
          JSON.stringify({ key, metadata })
        );
      }
    } catch (error) {
      console.error('Erro ao salvar chaves no armazenamento:', error);
    }
  }
  
  /**
   * Criar nova chave
   * @param purpose Finalidade da chave (ex: 'data_encryption', 'token_signing')
   * @param algorithm Algoritmo a ser usado (padrão: AES-256-GCM)
   * @returns ID da chave criada
   */
  public createKey(purpose: string, algorithm: string = this.DEFAULT_ALGO): string {
    const keyId = this.generateKeyId();
    const keyMaterial = randomBytes(32).toString('hex'); // 256 bits
    
    const metadata: KeyMetadata = {
      id: keyId,
      createdAt: Date.now(),
      version: 1,
      algorithm,
      status: 'active',
      purpose
    };
    
    this.keys.set(keyId, { key: keyMaterial, metadata });
    this.saveKeysToStorage();
    
    console.log(`Nova chave criada para ${purpose}: ${keyId}`);
    return keyId;
  }
  
  /**
   * Obter uma chave pelo ID
   * @param keyId ID da chave
   * @returns Material da chave ou null se não encontrada
   */
  public getKey(keyId: string): string | null {
    const keyEntry = this.keys.get(keyId);
    
    if (!keyEntry) {
      console.warn(`Tentativa de acessar chave inexistente: ${keyId}`);
      return null;
    }
    
    // Verificar se a chave foi revogada
    if (keyEntry.metadata.status === 'revoked') {
      console.error(`Tentativa de usar chave revogada: ${keyId}`);
      return null;
    }
    
    return keyEntry.key;
  }
  
  /**
   * Obter a chave ativa mais recente para uma finalidade específica
   * @param purpose Finalidade da chave
   * @returns ID e material da chave, ou null se não encontrada
   */
  public getActiveKeyForPurpose(purpose: string): { id: string, key: string } | null {
    let latestKey: { id: string, key: string, createdAt: number } | null = null;
    
    for (const [keyId, { key, metadata }] of this.keys.entries()) {
      if (metadata.purpose === purpose && metadata.status === 'active') {
        if (!latestKey || metadata.createdAt > latestKey.createdAt) {
          latestKey = { id: keyId, key, createdAt: metadata.createdAt };
        }
      }
    }
    
    if (!latestKey) {
      // Se não houver chave ativa, criar uma nova
      const newKeyId = this.createKey(purpose);
      const newKey = this.keys.get(newKeyId);
      
      if (newKey) {
        return { id: newKeyId, key: newKey.key };
      }
      
      return null;
    }
    
    return { id: latestKey.id, key: latestKey.key };
  }
  
  /**
   * Rotacionar uma chave (criar nova versão e deprecar a anterior)
   * @param keyId ID da chave a ser rotacionada
   * @returns ID da nova chave
   */
  public rotateKey(keyId: string): string | null {
    const keyEntry = this.keys.get(keyId);
    
    if (!keyEntry) {
      console.error(`Tentativa de rotacionar chave inexistente: ${keyId}`);
      return null;
    }
    
    // Marcar a chave atual como deprecated
    keyEntry.metadata.status = 'deprecated';
    keyEntry.metadata.rotatedAt = Date.now();
    
    // Criar nova chave com a mesma finalidade
    const newKeyId = this.createKey(
      keyEntry.metadata.purpose, 
      keyEntry.metadata.algorithm
    );
    
    this.saveKeysToStorage();
    console.log(`Chave rotacionada: ${keyId} -> ${newKeyId}`);
    
    return newKeyId;
  }
  
  /**
   * Revogar uma chave (marcar como inutilizável)
   * @param keyId ID da chave a ser revogada
   */
  public revokeKey(keyId: string): boolean {
    const keyEntry = this.keys.get(keyId);
    
    if (!keyEntry) {
      console.error(`Tentativa de revogar chave inexistente: ${keyId}`);
      return false;
    }
    
    keyEntry.metadata.status = 'revoked';
    this.saveKeysToStorage();
    
    console.log(`Chave revogada: ${keyId}`);
    return true;
  }
  
  /**
   * Gerar ID único para uma chave
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(8).toString('hex');
    const hash = createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 16);
    
    return `key-${hash}`;
  }
  
  /**
   * Remover chaves expiradas ou revogadas do armazenamento
   * @param olderThan Tempo mínimo (em ms) para manter chaves antigas (padrão: 30 dias)
   */
  public cleanupOldKeys(olderThan: number = 30 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [keyId, { metadata }] of this.keys.entries()) {
      // Remover chaves revogadas antigas
      if (
        metadata.status === 'revoked' || 
        (metadata.status === 'deprecated' && metadata.rotatedAt && 
         now - metadata.rotatedAt > olderThan)
      ) {
        this.keys.delete(keyId);
        secureLocalStorage.removeItem(`${this.STORAGE_PREFIX}${keyId}`);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      // Atualizar índice de chaves
      this.saveKeysToStorage();
      console.log(`${removedCount} chaves antigas removidas`);
    }
    
    return removedCount;
  }
  
  /**
   * Obter metadados de todas as chaves (sem o material criptográfico)
   */
  public getKeysMetadata(): KeyMetadata[] {
    return Array.from(this.keys.values()).map(({ metadata }) => metadata);
  }
}

// Exportar instância única
export const keyManager = KeyManager.getInstance(); 