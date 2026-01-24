/**
 * Financeiro Service - Serviço de Dados Financeiros
 * 
 * Este serviço gerencia a integração com dados financeiros da API Tiny:
 * - Contas a Pagar
 * - Contas a Receber
 * - Resumo Financeiro
 * - Cache e sincronização
 */

import { TinyApiService } from '@/lib/integrations/tiny/TinyApiService';
import { TINY_CONFIG } from '@/config';
import { 
  ContaPagar, 
  ContaReceber, 
  ResumoFinanceiro,
  FiltroContaPagar,
  FiltroContaReceber
} from '@/types/tiny';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface DadosFinanceiros {
  resumo: ResumoFinanceiro | null;
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  ultimaAtualizacao: Date | null;
  carregando: boolean;
  erro: string | null;
}

export interface MetricaFinanceira {
  titulo: string;
  valor: number;
  valorFormatado: string;
  variacao?: number;
  variacaoFormatada?: string;
  tendencia: 'up' | 'down' | 'neutral';
  descricao: string;
}

// ============================================
// FINANCEIRO SERVICE CLASS
// ============================================

class FinanceiroService {
  private tinyApi: TinyApiService | null = null;
  private dadosCache: DadosFinanceiros = {
    resumo: null,
    contasPagar: [],
    contasReceber: [],
    ultimaAtualizacao: null,
    carregando: false,
    erro: null
  };
  private readonly CACHE_KEY = 'financeiro_cache';
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.inicializarTinyApi();
    this.carregarCache();
  }

  /**
   * Inicializa a conexão com a API do Tiny
   */
  private inicializarTinyApi(): void {
    try {
      this.tinyApi = new TinyApiService({
        token: TINY_CONFIG.API_TOKEN,
        baseUrl: TINY_CONFIG.API_BASE_URL,
        cache: false,
        timeout: 30000
      });
      console.log('💰 [FinanceiroService] TinyAPI inicializada com sucesso');
    } catch (error) {
      console.error('❌ [FinanceiroService] Erro ao inicializar TinyAPI:', error);
    }
  }

  /**
   * Carrega dados do cache local
   */
  private carregarCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const dados = JSON.parse(cached);
        const ultimaAtualizacao = new Date(dados.ultimaAtualizacao);
        const agora = new Date();
        
        // Verificar se o cache ainda é válido
        if (agora.getTime() - ultimaAtualizacao.getTime() < this.CACHE_DURATION_MS) {
          this.dadosCache = {
            ...dados,
            ultimaAtualizacao,
            carregando: false,
            erro: null
          };
          console.log('📦 [FinanceiroService] Dados carregados do cache');
        }
      }
    } catch (error) {
      console.error('❌ [FinanceiroService] Erro ao carregar cache:', error);
    }
  }

  /**
   * Salva dados no cache local
   */
  private salvarCache(): void {
    try {
      const dadosParaSalvar = {
        resumo: this.dadosCache.resumo,
        contasPagar: this.dadosCache.contasPagar,
        contasReceber: this.dadosCache.contasReceber,
        ultimaAtualizacao: this.dadosCache.ultimaAtualizacao?.toISOString()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(dadosParaSalvar));
      console.log('💾 [FinanceiroService] Dados salvos no cache');
    } catch (error) {
      console.error('❌ [FinanceiroService] Erro ao salvar cache:', error);
    }
  }

  /**
   * Formata valor monetário para exibição
   */
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formata percentual para exibição
   */
  formatarPercentual(valor: number): string {
    const sinal = valor >= 0 ? '+' : '';
    return `${sinal}${valor.toFixed(1)}%`;
  }

  /**
   * Obtém data no formato dd/mm/yyyy
   */
  private formatarData(date: Date): string {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Obtém período padrão (últimos 30 dias)
   */
  private getPeriodoPadrao(): { dataInicial: string; dataFinal: string } {
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    return {
      dataInicial: this.formatarData(trintaDiasAtras),
      dataFinal: this.formatarData(hoje)
    };
  }

  /**
   * Busca dados financeiros completos da API Tiny
   */
  async buscarDadosFinanceiros(forceRefresh = false): Promise<DadosFinanceiros> {
    // Verificar se pode usar cache
    if (!forceRefresh && this.dadosCache.resumo && this.dadosCache.ultimaAtualizacao) {
      const agora = new Date();
      if (agora.getTime() - this.dadosCache.ultimaAtualizacao.getTime() < this.CACHE_DURATION_MS) {
        console.log('📦 [FinanceiroService] Retornando dados do cache');
        return this.dadosCache;
      }
    }

    if (!this.tinyApi) {
      return {
        ...this.dadosCache,
        erro: 'API Tiny não inicializada',
        carregando: false
      };
    }

    console.log('🔄 [FinanceiroService] Buscando dados financeiros da API Tiny...');
    this.dadosCache.carregando = true;
    this.dadosCache.erro = null;

    try {
      const { dataInicial, dataFinal } = this.getPeriodoPadrao();
      
      // Buscar dados em paralelo
      const [contasPagar, contasReceber, resumo] = await Promise.all([
        this.tinyApi.getContasPagar({ dataInicial, dataFinal }, true),
        this.tinyApi.getContasReceber({ dataInicial, dataFinal }, true),
        this.tinyApi.getResumoFinanceiro(dataInicial, dataFinal)
      ]);

      this.dadosCache = {
        resumo,
        contasPagar,
        contasReceber,
        ultimaAtualizacao: new Date(),
        carregando: false,
        erro: null
      };

      this.salvarCache();
      console.log('✅ [FinanceiroService] Dados financeiros atualizados com sucesso');
      
      return this.dadosCache;

    } catch (error: any) {
      console.error('❌ [FinanceiroService] Erro ao buscar dados financeiros:', error);
      
      this.dadosCache.carregando = false;
      this.dadosCache.erro = error.message || 'Erro ao buscar dados financeiros';
      
      return this.dadosCache;
    }
  }

  /**
   * Busca contas a pagar com filtros
   */
  async buscarContasPagar(filtros?: FiltroContaPagar): Promise<ContaPagar[]> {
    if (!this.tinyApi) {
      throw new Error('API Tiny não inicializada');
    }

    try {
      const contas = await this.tinyApi.getContasPagar(filtros, true);
      return contas;
    } catch (error: any) {
      console.error('❌ [FinanceiroService] Erro ao buscar contas a pagar:', error);
      throw error;
    }
  }

  /**
   * Busca contas a receber com filtros
   */
  async buscarContasReceber(filtros?: FiltroContaReceber): Promise<ContaReceber[]> {
    if (!this.tinyApi) {
      throw new Error('API Tiny não inicializada');
    }

    try {
      const contas = await this.tinyApi.getContasReceber(filtros, true);
      return contas;
    } catch (error: any) {
      console.error('❌ [FinanceiroService] Erro ao buscar contas a receber:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas financeiras formatadas para o Dashboard
   */
  async getMetricasFinanceiras(): Promise<MetricaFinanceira[]> {
    const dados = await this.buscarDadosFinanceiros();
    
    if (!dados.resumo) {
      return [];
    }

    const { resumo } = dados;
    
    // Calcular variações (simuladas por enquanto - idealmente comparar com período anterior)
    const metricas: MetricaFinanceira[] = [
      {
        titulo: 'Contas a Receber',
        valor: resumo.contas_receber.pendente,
        valorFormatado: this.formatarMoeda(resumo.contas_receber.pendente),
        variacao: 5.2,
        variacaoFormatada: '+5.2%',
        tendencia: 'up',
        descricao: `${resumo.contas_receber.quantidade} contas pendentes`
      },
      {
        titulo: 'Contas a Pagar',
        valor: resumo.contas_pagar.pendente,
        valorFormatado: this.formatarMoeda(resumo.contas_pagar.pendente),
        variacao: -8.1,
        variacaoFormatada: '-8.1%',
        tendencia: 'up', // Menos a pagar é bom
        descricao: `${resumo.contas_pagar.quantidade} contas pendentes`
      },
      {
        titulo: 'Fluxo de Caixa',
        valor: resumo.fluxo_caixa.saldo,
        valorFormatado: this.formatarMoeda(resumo.fluxo_caixa.saldo),
        variacao: resumo.fluxo_caixa.saldo > 0 ? 18.5 : -18.5,
        variacaoFormatada: resumo.fluxo_caixa.saldo > 0 ? '+18.5%' : '-18.5%',
        tendencia: resumo.fluxo_caixa.saldo > 0 ? 'up' : 'down',
        descricao: 'Entradas - Saídas'
      },
      {
        titulo: 'Saldo Projetado',
        valor: resumo.saldo,
        valorFormatado: this.formatarMoeda(resumo.saldo),
        variacao: resumo.saldo > 0 ? 12.3 : -12.3,
        variacaoFormatada: resumo.saldo > 0 ? '+12.3%' : '-12.3%',
        tendencia: resumo.saldo > 0 ? 'up' : 'down',
        descricao: 'A Receber - A Pagar'
      },
      {
        titulo: 'Total Recebido',
        valor: resumo.contas_receber.recebido,
        valorFormatado: this.formatarMoeda(resumo.contas_receber.recebido),
        variacao: 15.2,
        variacaoFormatada: '+15.2%',
        tendencia: 'up',
        descricao: 'Recebimentos no período'
      },
      {
        titulo: 'Total Pago',
        valor: resumo.contas_pagar.pago,
        valorFormatado: this.formatarMoeda(resumo.contas_pagar.pago),
        variacao: 8.7,
        variacaoFormatada: '+8.7%',
        tendencia: 'neutral',
        descricao: 'Pagamentos no período'
      }
    ];

    return metricas;
  }

  /**
   * Obtém contas vencidas
   */
  async getContasVencidas(): Promise<{ pagar: ContaPagar[]; receber: ContaReceber[] }> {
    const dados = await this.buscarDadosFinanceiros();
    const hoje = new Date();
    
    const contasPagarVencidas = dados.contasPagar.filter(conta => {
      if (conta.situacao === 'pago' || conta.situacao === 'cancelado') return false;
      const vencimento = this.parseDataBR(conta.data_vencimento);
      return vencimento && vencimento < hoje;
    });

    const contasReceberVencidas = dados.contasReceber.filter(conta => {
      if (conta.situacao === 'pago' || conta.situacao === 'cancelado') return false;
      const vencimento = this.parseDataBR(conta.data_vencimento);
      return vencimento && vencimento < hoje;
    });

    return {
      pagar: contasPagarVencidas,
      receber: contasReceberVencidas
    };
  }

  /**
   * Converte data no formato brasileiro (dd/mm/yyyy) para Date
   */
  private parseDataBR(dataStr: string): Date | null {
    if (!dataStr) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes.map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Obtém dados do cache atual
   */
  getDadosCache(): DadosFinanceiros {
    return this.dadosCache;
  }

  /**
   * Limpa o cache
   */
  limparCache(): void {
    this.dadosCache = {
      resumo: null,
      contasPagar: [],
      contasReceber: [],
      ultimaAtualizacao: null,
      carregando: false,
      erro: null
    };
    localStorage.removeItem(this.CACHE_KEY);
    console.log('🗑️ [FinanceiroService] Cache limpo');
  }
}

// Exportar instância única
export const financeiroService = new FinanceiroService();
