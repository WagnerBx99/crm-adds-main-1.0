/**
 * Hook useFinanceiro - Gerenciamento de dados financeiros
 * 
 * Este hook fornece acesso aos dados financeiros da API Tiny
 * com gerenciamento de estado, loading e erros.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  financeiroService, 
  DadosFinanceiros, 
  MetricaFinanceira 
} from '@/lib/services/financeiroService';
import { ContaPagar, ContaReceber, ResumoFinanceiro } from '@/types/tiny';

// ============================================
// TIPOS
// ============================================

export interface UseFinanceiroReturn {
  // Dados
  dados: DadosFinanceiros;
  metricas: MetricaFinanceira[];
  resumo: ResumoFinanceiro | null;
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  contasVencidas: { pagar: ContaPagar[]; receber: ContaReceber[] };
  
  // Estados
  carregando: boolean;
  erro: string | null;
  ultimaAtualizacao: Date | null;
  
  // Ações
  atualizar: () => Promise<void>;
  limparCache: () => void;
  
  // Formatadores
  formatarMoeda: (valor: number) => string;
  formatarPercentual: (valor: number) => string;
}

// ============================================
// HOOK
// ============================================

export function useFinanceiro(): UseFinanceiroReturn {
  const [dados, setDados] = useState<DadosFinanceiros>(financeiroService.getDadosCache());
  const [metricas, setMetricas] = useState<MetricaFinanceira[]>([]);
  const [contasVencidas, setContasVencidas] = useState<{ pagar: ContaPagar[]; receber: ContaReceber[] }>({ pagar: [], receber: [] });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Busca dados financeiros da API
   */
  const atualizar = useCallback(async (forceRefresh = true) => {
    setCarregando(true);
    setErro(null);

    try {
      console.log('🔄 [useFinanceiro] Atualizando dados financeiros...');
      
      // Buscar dados financeiros
      const dadosAtualizados = await financeiroService.buscarDadosFinanceiros(forceRefresh);
      setDados(dadosAtualizados);

      // Buscar métricas formatadas
      const metricasAtualizadas = await financeiroService.getMetricasFinanceiras();
      setMetricas(metricasAtualizadas);

      // Buscar contas vencidas
      const vencidas = await financeiroService.getContasVencidas();
      setContasVencidas(vencidas);

      if (dadosAtualizados.erro) {
        setErro(dadosAtualizados.erro);
      }

      console.log('✅ [useFinanceiro] Dados atualizados com sucesso');
    } catch (error: any) {
      console.error('❌ [useFinanceiro] Erro ao atualizar:', error);
      setErro(error.message || 'Erro ao buscar dados financeiros');
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Limpa o cache de dados financeiros
   */
  const limparCache = useCallback(() => {
    financeiroService.limparCache();
    setDados(financeiroService.getDadosCache());
    setMetricas([]);
    setContasVencidas({ pagar: [], receber: [] });
    console.log('🗑️ [useFinanceiro] Cache limpo');
  }, []);

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    // Carregar dados do cache primeiro
    const dadosCache = financeiroService.getDadosCache();
    if (dadosCache.resumo) {
      setDados(dadosCache);
      // Buscar métricas do cache
      financeiroService.getMetricasFinanceiras().then(setMetricas);
      financeiroService.getContasVencidas().then(setContasVencidas);
    }

    // Atualizar dados da API (sem forçar se cache válido)
    atualizar(false);
  }, []);

  return {
    // Dados
    dados,
    metricas,
    resumo: dados.resumo,
    contasPagar: dados.contasPagar,
    contasReceber: dados.contasReceber,
    contasVencidas,
    
    // Estados
    carregando: carregando || dados.carregando,
    erro: erro || dados.erro,
    ultimaAtualizacao: dados.ultimaAtualizacao,
    
    // Ações
    atualizar: () => atualizar(true),
    limparCache,
    
    // Formatadores
    formatarMoeda: financeiroService.formatarMoeda,
    formatarPercentual: financeiroService.formatarPercentual
  };
}

export default useFinanceiro;
