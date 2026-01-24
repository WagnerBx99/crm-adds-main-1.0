/**
 * FinanceiroDashboard - Componente de Dashboard Financeiro
 * 
 * Este componente exibe dados financeiros reais da API Tiny:
 * - Resumo financeiro (contas a pagar/receber)
 * - Métricas de fluxo de caixa
 * - Contas vencidas
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Activity, RefreshCw, ArrowUp, ArrowDown, Loader2, CheckCircle,
  CreditCard, Wallet, PiggyBank, Receipt, Calendar, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { ContaPagar, ContaReceber } from '@/types/tiny';

// Design System
const designSystem = {
  surfaces: { 
    glass: "bg-surface-1/80 backdrop-blur-xl border border-accent-primary/15 shadow-2xl shadow-accent-primary/10",
  }
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
  error?: string | null;
}

function MetricCard({ title, value, change, trend = 'neutral', icon: Icon, description, isLoading, error }: MetricCardProps) {
  if (error) {
    return (
      <Card className="border-semantic-error/20 bg-gradient-to-br from-semantic-error/5 to-semantic-error/2">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-semantic-error mx-auto mb-2" />
          <p className="text-sm text-semantic-error font-medium">Erro ao carregar</p>
          <p className="text-xs text-text-low mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={designSystem.surfaces.glass}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-surface-1 rounded-lg"></div>
              <div className="w-16 h-4 bg-surface-1 rounded"></div>
            </div>
            <div className="w-3/4 h-4 bg-surface-1 rounded"></div>
            <div className="w-1/2 h-8 bg-surface-1 rounded"></div>
            <div className="w-full h-3 bg-surface-1 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(designSystem.surfaces.glass, "group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer")}>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl backdrop-blur-sm transition-all duration-500 bg-accent-primary/15 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="w-5 h-5 text-accent-primary" />
          </div>
          {change && (
            <Badge variant="outline" className={cn(
              "text-xs font-semibold backdrop-blur-sm transition-all duration-300",
              trend === 'up' && "bg-semantic-success/15 text-semantic-success",
              trend === 'down' && "bg-semantic-error/15 text-semantic-error",
              trend === 'neutral' && "bg-surface-1 text-text-low"
            )}>
              {trend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
              {change}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-low/90 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-text-high">{value}</p>
          {description && (
            <p className="text-xs text-text-low">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para lista de contas
interface ContaItemProps {
  tipo: 'pagar' | 'receber';
  documento: string;
  entidade: string;
  valor: number;
  vencimento: string;
  situacao: string;
  formatarMoeda: (valor: number) => string;
}

function ContaItem({ tipo, documento, entidade, valor, vencimento, situacao, formatarMoeda }: ContaItemProps) {
  const isVencida = situacao === 'vencido' || (situacao !== 'pago' && situacao !== 'cancelado' && new Date(vencimento.split('/').reverse().join('-')) < new Date());
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      isVencida ? "bg-semantic-error/5 border-semantic-error/20" : "bg-surface-1/50 border-accent-primary/10"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          tipo === 'pagar' ? "bg-semantic-error/10" : "bg-semantic-success/10"
        )}>
          {tipo === 'pagar' ? (
            <TrendingDown className={cn("w-4 h-4", "text-semantic-error")} />
          ) : (
            <TrendingUp className={cn("w-4 h-4", "text-semantic-success")} />
          )}
        </div>
        <div>
          <p className="font-medium text-text-high text-sm">{entidade}</p>
          <p className="text-xs text-text-low">Doc: {documento} • Venc: {vencimento}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-bold",
          tipo === 'pagar' ? "text-semantic-error" : "text-semantic-success"
        )}>
          {tipo === 'pagar' ? '-' : '+'}{formatarMoeda(valor)}
        </p>
        {isVencida && (
          <Badge variant="destructive" className="text-xs">Vencida</Badge>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function FinanceiroDashboard() {
  const {
    dados,
    metricas,
    resumo,
    contasPagar,
    contasReceber,
    contasVencidas,
    carregando,
    erro,
    ultimaAtualizacao,
    atualizar,
    formatarMoeda
  } = useFinanceiro();

  // Formatar última atualização
  const formatarUltimaAtualizacao = () => {
    if (!ultimaAtualizacao) return 'Nunca';
    return ultimaAtualizacao.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de atualizar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-high flex items-center gap-2">
            <Wallet className="h-6 w-6 text-accent-primary" />
            Dados Financeiros - API Tiny
          </h2>
          <p className="text-sm text-text-low">
            Última atualização: {formatarUltimaAtualizacao()}
          </p>
        </div>
        <Button 
          onClick={atualizar} 
          disabled={carregando}
          variant="outline"
          className="bg-surface-1/95 backdrop-blur-xl border-accent-primary/20"
        >
          {carregando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Dados
        </Button>
      </div>

      {/* Mensagem de erro geral */}
      {erro && (
        <Card className="border-semantic-warning/20 bg-semantic-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-semantic-warning" />
            <div>
              <p className="font-medium text-semantic-warning">Aviso</p>
              <p className="text-sm text-text-low">{erro}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricas.length > 0 ? (
          metricas.map((metrica, index) => (
            <MetricCard
              key={index}
              title={metrica.titulo}
              value={metrica.valorFormatado}
              change={metrica.variacaoFormatada}
              trend={metrica.tendencia}
              icon={index === 0 ? Clock : index === 1 ? AlertTriangle : index === 2 ? Activity : index === 3 ? PiggyBank : index === 4 ? CheckCircle : Receipt}
              description={metrica.descricao}
              isLoading={carregando && metricas.length === 0}
              error={null}
            />
          ))
        ) : (
          // Placeholders enquanto carrega
          <>
            <MetricCard title="Contas a Receber" value="Carregando..." icon={Clock} isLoading={carregando} error={null} />
            <MetricCard title="Contas a Pagar" value="Carregando..." icon={AlertTriangle} isLoading={carregando} error={null} />
            <MetricCard title="Fluxo de Caixa" value="Carregando..." icon={Activity} isLoading={carregando} error={null} />
            <MetricCard title="Saldo Projetado" value="Carregando..." icon={PiggyBank} isLoading={carregando} error={null} />
            <MetricCard title="Total Recebido" value="Carregando..." icon={CheckCircle} isLoading={carregando} error={null} />
            <MetricCard title="Total Pago" value="Carregando..." icon={Receipt} isLoading={carregando} error={null} />
          </>
        )}
      </div>

      {/* Resumo do período */}
      {resumo && (
        <Card className={designSystem.surfaces.glass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-accent-primary" />
              Resumo do Período ({resumo.periodo.inicio} a {resumo.periodo.fim})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contas a Receber */}
              <div className="space-y-3">
                <h4 className="font-semibold text-semantic-success flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Contas a Receber
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-low">Total:</span>
                    <span className="font-medium">{formatarMoeda(resumo.contas_receber.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Recebido:</span>
                    <span className="font-medium text-semantic-success">{formatarMoeda(resumo.contas_receber.recebido)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Pendente:</span>
                    <span className="font-medium">{formatarMoeda(resumo.contas_receber.pendente)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Vencido:</span>
                    <span className="font-medium text-semantic-error">{formatarMoeda(resumo.contas_receber.vencido)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-text-low">Quantidade:</span>
                    <span className="font-medium">{resumo.contas_receber.quantidade} contas</span>
                  </div>
                </div>
              </div>

              {/* Contas a Pagar */}
              <div className="space-y-3">
                <h4 className="font-semibold text-semantic-error flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Contas a Pagar
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-low">Total:</span>
                    <span className="font-medium">{formatarMoeda(resumo.contas_pagar.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Pago:</span>
                    <span className="font-medium text-semantic-success">{formatarMoeda(resumo.contas_pagar.pago)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Pendente:</span>
                    <span className="font-medium">{formatarMoeda(resumo.contas_pagar.pendente)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Vencido:</span>
                    <span className="font-medium text-semantic-error">{formatarMoeda(resumo.contas_pagar.vencido)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-text-low">Quantidade:</span>
                    <span className="font-medium">{resumo.contas_pagar.quantidade} contas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contas Vencidas */}
      {(contasVencidas.pagar.length > 0 || contasVencidas.receber.length > 0) && (
        <Card className="border-semantic-error/20 bg-semantic-error/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-semantic-error">
              <AlertTriangle className="h-5 w-5" />
              Contas Vencidas ({contasVencidas.pagar.length + contasVencidas.receber.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contasVencidas.receber.slice(0, 5).map((conta, index) => (
              <ContaItem
                key={`receber-${index}`}
                tipo="receber"
                documento={conta.numero_documento}
                entidade={conta.cliente.nome}
                valor={conta.saldo}
                vencimento={conta.data_vencimento}
                situacao={conta.situacao}
                formatarMoeda={formatarMoeda}
              />
            ))}
            {contasVencidas.pagar.slice(0, 5).map((conta, index) => (
              <ContaItem
                key={`pagar-${index}`}
                tipo="pagar"
                documento={conta.numero_documento}
                entidade={conta.fornecedor.nome}
                valor={conta.saldo}
                vencimento={conta.data_vencimento}
                situacao={conta.situacao}
                formatarMoeda={formatarMoeda}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de últimas contas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Contas a Receber */}
        <Card className={designSystem.surfaces.glass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-semantic-success" />
              Últimas Contas a Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carregando && contasReceber.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
              </div>
            ) : contasReceber.length === 0 ? (
              <p className="text-center text-text-low py-4">Nenhuma conta encontrada</p>
            ) : (
              contasReceber.slice(0, 5).map((conta, index) => (
                <ContaItem
                  key={index}
                  tipo="receber"
                  documento={conta.numero_documento}
                  entidade={conta.cliente.nome}
                  valor={conta.valor}
                  vencimento={conta.data_vencimento}
                  situacao={conta.situacao}
                  formatarMoeda={formatarMoeda}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimas Contas a Pagar */}
        <Card className={designSystem.surfaces.glass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-semantic-error" />
              Últimas Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carregando && contasPagar.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
              </div>
            ) : contasPagar.length === 0 ? (
              <p className="text-center text-text-low py-4">Nenhuma conta encontrada</p>
            ) : (
              contasPagar.slice(0, 5).map((conta, index) => (
                <ContaItem
                  key={index}
                  tipo="pagar"
                  documento={conta.numero_documento}
                  entidade={conta.fornecedor.nome}
                  valor={conta.valor}
                  vencimento={conta.data_vencimento}
                  situacao={conta.situacao}
                  formatarMoeda={formatarMoeda}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinanceiroDashboard;
