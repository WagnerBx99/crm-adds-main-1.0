import { createContext, useContext } from 'react';
import { TinyApiService } from './TinyApiService';
import { TinyApiRepositoryMock } from './TinyApiRepositoryMock';
import { tinyConfig, useMockApi } from './tinyConfig';
import { TinyApiConfig, StatusPedido, Cliente, ClienteDTO, FiltroCliente, FiltroPedido, Pedido, PedidoDetalhado, FiltroNotaFiscal, NotaFiscal } from '../../../types/tiny';
import { tinyApiClient } from './api';

/**
 * Interface do serviço do Tiny
 */
export interface ITinyService {
  /**
   * Busca clientes com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de clientes normalizada e validada pelo schema Zod
   */
  getClientes(filtros?: FiltroCliente, forceRefresh?: boolean): Promise<Cliente[]>;
  
  /**
   * Busca cliente por ID
   * @param id ID do cliente
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados do cliente normalizados e validados pelo schema Zod
   */
  getClienteById(id: string, forceRefresh?: boolean): Promise<Cliente>;
  
  /**
   * Cria um novo cliente
   * @param cliente Dados do cliente a ser criado
   * @returns ID do cliente criado
   */
  createCliente(cliente: ClienteDTO): Promise<string>;
  
  /**
   * Atualiza os dados de um cliente existente
   * @param id ID do cliente a ser atualizado
   * @param cliente Novos dados do cliente
   * @returns Sucesso da operação
   */
  updateCliente(id: string, cliente: ClienteDTO): Promise<boolean>;
  
  /**
   * Busca pedidos com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de pedidos normalizada e validada pelo schema Zod
   */
  getPedidos(filtros?: FiltroPedido, forceRefresh?: boolean): Promise<Pedido[]>;
  
  /**
   * Busca pedido por ID
   * @param id ID do pedido
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados do pedido normalizados e validados pelo schema Zod
   */
  getPedidoById(id: string, forceRefresh?: boolean): Promise<PedidoDetalhado>;
  
  /**
   * Busca detalhes completos de um pedido
   * @param id ID do pedido
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados detalhados do pedido
   */
  getPedidoDetalhes(id: string, forceRefresh?: boolean): Promise<PedidoDetalhado>;
  
  /**
   * Atualiza o status de um pedido
   * @param id ID do pedido
   * @param status Novo status
   * @returns Verdadeiro se atualizado com sucesso
   */
  updateStatusPedido(id: string, status: StatusPedido): Promise<boolean>;
  
  /**
   * Busca notas fiscais com os filtros informados
   * @param filtros Filtros de busca de notas fiscais
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de notas fiscais normalizada e validada
   */
  getNotasFiscais(filtros?: FiltroNotaFiscal, forceRefresh?: boolean): Promise<NotaFiscal[]>;
  
  /**
   * Busca notas fiscais de um cliente específico
   * @param clienteId ID do cliente ou CPF/CNPJ
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de notas fiscais do cliente
   */
  getNotasFiscaisPorCliente(clienteId: string, forceRefresh?: boolean): Promise<NotaFiscal[]>;
  
  /**
   * Lista de produtos com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de produtos normalizada e validada pelo schema Zod
   */
  listarProdutos: (filtros?: any, forceRefresh?: boolean) => Promise<any[]>;
  
  /**
   * Testa a conexão com a API do Tiny
   * @returns true se a conexão for bem-sucedida, false caso contrário
   */
  testConnection: () => Promise<boolean>;
  
  /**
   * Reinicializa o serviço com novas configurações
   * @param config Configurações parciais para atualizar
   */
  reinitialize: (config: Partial<TinyApiConfig>) => Promise<void>;
}

/**
 * Singleton para o serviço do Tiny
 */
let tinyServiceInstance: ITinyService | null = null;

/**
 * Fábrica para criação do serviço do Tiny
 * @param token Token de acesso da API Tiny
 * @param baseUrl URL base da API Tiny (opcional)
 * @param useCache Usar cache (opcional, padrão true)
 * @returns Instância do serviço do Tiny
 */
export function createTinyService(
  token: string,
  baseUrl?: string,
  useCache: boolean = true
): ITinyService {
  if (!tinyServiceInstance) {
    console.log('[TinyServiceFactory] Criando instância do TinyApiService');
    
    const apiService = new TinyApiService({
      token,
      baseUrl,
      cache: useCache,
      cacheExpiration: 3600000, // 1 hora
    });
    
    tinyServiceInstance = apiService;
  }
  
  return tinyServiceInstance;
}

/**
 * Contexto React para o serviço do Tiny
 */
const TinyServiceContext = createContext<ITinyService | null>(null);

/**
 * Hook para acesso ao serviço do Tiny
 * @returns Instância do serviço do Tiny
 */
export function useTinyService(): ITinyService {
  const context = useContext(TinyServiceContext);
  
  if (!context) {
    throw new Error('useTinyService deve ser usado dentro de um TinyServiceProvider');
  }
  
  return context;
}

/**
 * Provider para o serviço do Tiny
 */
export const TinyServiceProvider = TinyServiceContext.Provider;

/**
 * Factory que cria uma instância adequada do serviço Tiny
 * Usa implementação mock se configurado, caso contrário usa a API real
 */
export class TinyServiceFactory implements ITinyService {
  private delegate: ITinyService;
  
  constructor() {
    console.log('[TinyServiceFactory] Inicializando serviço Tiny');
    
    // Sempre usar a implementação real da API
    console.log('[TinyServiceFactory] Usando implementação real da API');
    
    const config: TinyApiConfig = {
      token: tinyConfig.token,
      baseUrl: tinyConfig.baseUrl,
      cache: true,
    };
    
    this.delegate = new TinyApiService(config);
  }
  
  async testConnection(): Promise<boolean> {
    try {
      if (!this.delegate.testConnection) {
        // Implementação básica de teste para serviços que não implementam testConnection
        const clientes = await this.delegate.getClientes({ registros_por_pagina: 1 });
        return true;
      }
      return await this.delegate.testConnection();
    } catch (error) {
      console.error('[TinyServiceFactory] Erro no teste de conexão:', error);
      return false;
    }
  }
  
  async reinitialize(config: Partial<TinyApiConfig>): Promise<void> {
    if (!this.delegate.reinitialize) {
      // Para serviços que não suportam reinicialização, recriamos a instância
      console.log('[TinyServiceFactory] Recriando serviço com novas configurações');
      
      const fullConfig: TinyApiConfig = {
        token: config.token || tinyConfig.token,
        baseUrl: config.baseUrl || tinyConfig.baseUrl,
        cache: config.cache !== undefined ? config.cache : true,
      };
      
      this.delegate = new TinyApiService(fullConfig);
      return;
    }
    
    await this.delegate.reinitialize(config);
  }
  
  async getClientes(filtros?: FiltroCliente, forceRefresh?: boolean): Promise<Cliente[]> {
    try {
      if (!this.delegate.getClientes) {
        throw new Error('Método getClientes não implementado');
      }
      return await this.delegate.getClientes(filtros, forceRefresh);
    } catch (error) {
      console.error('[TinyServiceFactory] Erro ao buscar clientes:', error);
      throw error;
    }
  }
  
  async getClienteById(id: string, forceRefresh?: boolean): Promise<Cliente> {
    try {
      return await this.delegate.getClienteById(id, forceRefresh);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao buscar cliente ${id}:`, error);
      throw error;
    }
  }
  
  async createCliente(cliente: ClienteDTO): Promise<string> {
    try {
      return await this.delegate.createCliente(cliente);
    } catch (error) {
      console.error('[TinyServiceFactory] Erro ao criar cliente:', error);
      throw error;
    }
  }
  
  async updateCliente(id: string, cliente: ClienteDTO): Promise<boolean> {
    try {
      return await this.delegate.updateCliente(id, cliente);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao atualizar cliente ${id}:`, error);
      throw error;
    }
  }
  
  async getPedidos(filtros?: FiltroPedido, forceRefresh?: boolean): Promise<Pedido[]> {
    try {
      return await this.delegate.getPedidos(filtros, forceRefresh);
    } catch (error) {
      // Caso específico: erro de "A consulta não retornou registros"
      // Apenas logar e retornar array vazio, não relançar esse erro específico
      if (error instanceof Error && error.message.includes('não retornou registros')) {
        console.warn('[TinyServiceFactory] Consulta de pedidos não retornou registros, retornando array vazio');
        return [];
      }
      
      // Para outros erros (rede, autenticação, etc), logamos e relançamos
      console.error('[TinyServiceFactory] Erro ao buscar pedidos:', error);
      throw error;
    }
  }
  
  async getPedidoById(id: string, forceRefresh?: boolean): Promise<PedidoDetalhado> {
    try {
      return await this.delegate.getPedidoById(id, forceRefresh);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao buscar pedido ${id}:`, error);
      throw error;
    }
  }
  
  async getPedidoDetalhes(pedidoId: string, forceRefresh?: boolean): Promise<PedidoDetalhado> {
    try {
      return await this.delegate.getPedidoDetalhes(pedidoId, forceRefresh);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao buscar detalhes do pedido ${pedidoId}:`, error);
      throw error;
    }
  }
  
  async updateStatusPedido(id: string, status: StatusPedido): Promise<boolean> {
    try {
      return await this.delegate.updateStatusPedido(id, status);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao atualizar status do pedido ${id}:`, error);
      throw error;
    }
  }
  
  async getNotasFiscais(filtros?: FiltroNotaFiscal, forceRefresh?: boolean): Promise<NotaFiscal[]> {
    try {
      return await this.delegate.getNotasFiscais(filtros, forceRefresh);
    } catch (error) {
      console.error('[TinyServiceFactory] Erro ao buscar notas fiscais:', error);
      throw error;
    }
  }
  
  async getNotasFiscaisPorCliente(clienteId: string, forceRefresh?: boolean): Promise<NotaFiscal[]> {
    try {
      return await this.delegate.getNotasFiscaisPorCliente(clienteId, forceRefresh);
    } catch (error) {
      console.error(`[TinyServiceFactory] Erro ao buscar notas fiscais do cliente ${clienteId}:`, error);
      throw error;
    }
  }
  
  async listarProdutos(filtros?: any, forceRefresh?: boolean): Promise<any[]> {
    try {
      return await this.delegate.listarProdutos(filtros, forceRefresh);
    } catch (error) {
      console.error('[TinyServiceFactory] Erro ao listar produtos:', error);
      throw error;
    }
  }
}

// Instância global do serviço
export const tinyService = new TinyServiceFactory(); 