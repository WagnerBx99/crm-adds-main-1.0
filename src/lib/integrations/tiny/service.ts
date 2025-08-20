import { TinyApiClient } from './api';
import { 
  TinyApiConfig,
  TinyIntegrationConfig, 
  TinyIntegrationState,
  TinyContact,
  TinyProduct,
  TinyOrder,
  SyncResult,
  ConnectionTestResult
} from './types';
import { fetchTinyContacts, createTinyContact, updateTinyContact, deleteTinyContact } from '@/lib/services/tinyService';
import { TINY_CONFIG } from '@/config';

/**
 * Serviço para integração com a API Tiny
 */
export class TinyIntegrationService {
  private client: TinyApiClient;
  private config: TinyIntegrationConfig;
  private state: TinyIntegrationState = {
    connected: false,
    lastSync: null,
    lastError: null,
    syncInProgress: false,
    contactsCount: 0,
    productsCount: 0,
    ordersCount: 0,
  };
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Configuração padrão
    this.config = {
      apiToken: TINY_CONFIG.API_TOKEN,
      apiUrl: TINY_CONFIG.API_BASE_URL,
      enabled: false,
      autoSync: false,
      syncInterval: 60, // 1 hora
      syncContacts: true,
      syncProducts: false,
      syncOrders: false,
    };

    // Carregar configuração salva (se existir)
    this.loadConfig();
    
    // Iniciar sincronização automática se estiver habilitada
    if (this.config.enabled && this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): TinyIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Obtém o estado atual da integração
   */
  getState(): TinyIntegrationState {
    return { ...this.state };
  }

  /**
   * Salva a configuração
   */
  saveConfig(config: Partial<TinyIntegrationConfig>): void {
    // Atualizar configuração
    this.config = { ...this.config, ...config };
    
    // Salvar no localStorage
    localStorage.setItem('tiny_integration_config', JSON.stringify(this.config));
    
    // Parar sincronização automática existente
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Iniciar sincronização automática se habilitada
    if (this.config.enabled && this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Carrega a configuração salva
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('tiny_integration_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      
      const savedState = localStorage.getItem('tiny_integration_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Converter string de data para objeto Date
        if (parsedState.lastSync) {
          parsedState.lastSync = new Date(parsedState.lastSync);
        }
        this.state = { ...this.state, ...parsedState };
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da integração Tiny:', error);
    }
  }

  /**
   * Inicia a sincronização automática
   */
  private startAutoSync(): void {
    // Converter minutos para milissegundos
    const intervalMs = this.config.syncInterval * 60 * 1000;
    
    this.syncInterval = setInterval(() => {
      // Executar sincronização apenas se não estiver em andamento
      if (!this.state.syncInProgress) {
        this.syncData();
      }
    }, intervalMs);
  }

  /**
   * Testa a conexão com a API Tiny
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      this.state.syncInProgress = true;
      
      // Tentar buscar contatos como teste de conexão
      const contacts = await fetchTinyContacts();
      
      // Atualizar estado
      this.state.connected = true;
      this.state.lastError = null;
      this.state.contactsCount = contacts.length;
      
      // Salvar estado
      this.saveState();
      
      return {
        success: true,
        message: `Conexão estabelecida com sucesso. ${contacts.length} contatos encontrados.`,
      };
    } catch (error) {
      // Atualizar estado
      this.state.connected = false;
      this.state.lastError = error instanceof Error ? error.message : String(error);
      
      // Salvar estado
      this.saveState();
      
      return {
        success: false,
        message: 'Falha ao conectar com a API Tiny',
        details: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.state.syncInProgress = false;
    }
  }

  /**
   * Sincroniza dados com o Tiny
   */
  async syncData(): Promise<SyncResult> {
    if (this.state.syncInProgress) {
      return {
        success: false,
        added: 0,
        updated: 0,
        failed: 0,
        errors: ['Sincronização já em andamento'],
      };
    }
    
    try {
      this.state.syncInProgress = true;
      
      const result: SyncResult = {
        success: true,
        added: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };
      
      // Sincronizar contatos
      if (this.config.syncContacts) {
        const contacts = await fetchTinyContacts();
        this.state.contactsCount = contacts.length;
        result.added += contacts.length; // Simplificado para exemplo
      }
      
      // Atualizar estado
      this.state.lastSync = new Date();
      this.state.lastError = null;
      
      // Salvar estado
      this.saveState();
      
      return result;
    } catch (error) {
      // Atualizar estado
      this.state.lastError = error instanceof Error ? error.message : String(error);
      
      // Salvar estado
      this.saveState();
      
      return {
        success: false,
        added: 0,
        updated: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    } finally {
      this.state.syncInProgress = false;
    }
  }

  /**
   * Salva o estado atual
   */
  private saveState(): void {
    localStorage.setItem('tiny_integration_state', JSON.stringify(this.state));
  }

  /**
   * Sincroniza os contatos/clientes
   */
  private async syncContacts(): Promise<TinyContact[]> {
    try {
      const response = await this.client.searchContacts({
        situacao: 'A',
        registros_por_pagina: 100
      });

      const contacts = response.contatos || [];
      
      // Aqui você pode implementar a lógica para salvar os contatos no seu sistema
      console.log(`Sincronizados ${contacts.length} contatos`);
      
      return contacts;
    } catch (error) {
      console.error('Erro ao sincronizar contatos:', error);
      throw error;
    }
  }

  /**
   * Sincroniza os produtos
   */
  private async syncProducts(): Promise<TinyProduct[]> {
    try {
      const response = await this.client.searchProducts({
        situacao: 'A',
        registros_por_pagina: 100
      });

      const products = response.produtos || [];
      
      // Aqui você pode implementar a lógica para salvar os produtos no seu sistema
      console.log(`Sincronizados ${products.length} produtos`);
      
      return products;
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error);
      throw error;
    }
  }

  /**
   * Sincroniza os pedidos
   */
  private async syncOrders(): Promise<TinyOrder[]> {
    try {
      const response = await this.client.searchOrders({
        registros_por_pagina: 100
      });

      const orders = response.pedidos || [];
      
      // Aqui você pode implementar a lógica para salvar os pedidos no seu sistema
      console.log(`Sincronizados ${orders.length} pedidos`);
      
      return orders;
    } catch (error) {
      console.error('Erro ao sincronizar pedidos:', error);
      throw error;
    }
  }

  /**
   * Busca contatos/clientes
   */
  async getContacts(search?: string): Promise<TinyContact[]> {
    if (!this.state.connected) {
      await this.testConnection();
    }

    const response = await this.client.searchContacts({
      pesquisa: search,
      situacao: 'A',
      registros_por_pagina: 100
    });

    return response.contatos || [];
  }

  /**
   * Busca produtos
   */
  async getProducts(search?: string): Promise<TinyProduct[]> {
    if (!this.state.connected) {
      await this.testConnection();
    }

    const response = await this.client.searchProducts({
      pesquisa: search,
      situacao: 'A',
      registros_por_pagina: 100
    });

    return response.produtos || [];
  }

  /**
   * Busca pedidos
   */
  async getOrders(search?: string): Promise<TinyOrder[]> {
    if (!this.state.connected) {
      await this.testConnection();
    }

    const response = await this.client.searchOrders({
      pesquisa: search,
      registros_por_pagina: 100
    });

    return response.pedidos || [];
  }
} 