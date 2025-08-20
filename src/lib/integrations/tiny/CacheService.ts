/**
 * Serviço de cache local para desenvolvimento sem banco de dados
 * Utiliza localStorage para armazenar dados durante o desenvolvimento
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export class CacheService {
  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param data Dados a serem armazenados
   * @param expiresIn Tempo de expiração em milissegundos (padrão: 1 hora)
   */
  static setItem<T>(key: string, data: T, expiresIn: number = 3600000): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    
    try {
      localStorage.setItem(`tiny_cache_${key}`, JSON.stringify(cacheItem));
      console.info(`[CacheService] Item '${key}' armazenado em cache`);
    } catch (error) {
      console.error(`[CacheService] Erro ao armazenar item '${key}' em cache:`, error);
    }
  }
  
  /**
   * Recupera um item do cache
   * @param key Chave do item
   * @returns Os dados armazenados, ou null se não encontrado ou expirado
   */
  static getItem<T>(key: string): T | null {
    try {
      const storedItem = localStorage.getItem(`tiny_cache_${key}`);
      
      if (!storedItem) {
        return null;
      }
      
      const cacheItem: CacheItem<T> = JSON.parse(storedItem);
      const now = Date.now();
      
      // Verifica se o item expirou
      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        console.info(`[CacheService] Item '${key}' expirado, removendo do cache`);
        this.removeItem(key);
        return null;
      }
      
      console.info(`[CacheService] Item '${key}' recuperado do cache`);
      return cacheItem.data;
    } catch (error) {
      console.error(`[CacheService] Erro ao recuperar item '${key}' do cache:`, error);
      return null;
    }
  }
  
  /**
   * Remove um item do cache
   * @param key Chave do item
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(`tiny_cache_${key}`);
      console.info(`[CacheService] Item '${key}' removido do cache`);
    } catch (error) {
      console.error(`[CacheService] Erro ao remover item '${key}' do cache:`, error);
    }
  }
  
  /**
   * Limpa todo o cache relacionado ao Tiny
   */
  static clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('tiny_cache_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.info('[CacheService] Cache limpo com sucesso');
    } catch (error) {
      console.error('[CacheService] Erro ao limpar cache:', error);
    }
  }
  
  /**
   * Verifica se um item deve ser atualizado
   * @param key Chave do item
   * @param forceRefresh Forçar atualização
   * @param maxAge Idade máxima em milissegundos (padrão: 30 minutos)
   * @returns true se o item deve ser atualizado
   */
  static shouldRefresh(key: string, forceRefresh: boolean = false, maxAge: number = 1800000): boolean {
    if (forceRefresh) {
      return true;
    }
    
    try {
      const storedItem = localStorage.getItem(`tiny_cache_${key}`);
      
      if (!storedItem) {
        return true;
      }
      
      const cacheItem = JSON.parse(storedItem);
      const now = Date.now();
      
      // Retorna true se o item estiver próximo de expirar
      return (now - cacheItem.timestamp) > maxAge;
    } catch (error) {
      console.error(`[CacheService] Erro ao verificar atualização para '${key}':`, error);
      return true;
    }
  }
} 