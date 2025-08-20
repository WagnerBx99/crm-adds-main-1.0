import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, Package, CheckCircle, Clock, Timer, Workflow, 
  AlertTriangle, Repeat, Settings2, Target, Activity, RefreshCw, Sparkles,
  ArrowUp, ArrowDown, DollarSign, ShoppingCart, Users, Star, TrendingDown, 
  Loader2, PieChart as PieIcon, Calendar, MapPin, CreditCard, Smartphone,
  Store, Globe, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  ReferenceLine
} from 'recharts';

// Design System
const designSystem = {
  typography: { title: "text-3xl font-bold tracking-tight" },
  surfaces: { 
    glass: "bg-surface-1/80 backdrop-blur-xl border border-accent-primary/15 shadow-2xl shadow-accent-primary/10",
    premium: "bg-gradient-to-br from-surface-1/95 via-surface-0/80 to-surface-1/90 backdrop-blur-2xl border border-accent-primary/20 shadow-2xl"
  }
};

// Cores para gráficos
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#f97316', 
  tertiary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gradient: 'url(#colorGradient)'
};

// Função para gerar dados simulados
const getSalesData = () => ({
  evolution: [
    { mes: 'Set', vendas: 180000, meta: 200000, pedidos: 145, ticketMedio: 1241 },
    { mes: 'Out', vendas: 210000, meta: 200000, pedidos: 168, ticketMedio: 1250 },
    { mes: 'Nov', vendas: 245000, meta: 220000, pedidos: 196, ticketMedio: 1250 },
    { mes: 'Dez', vendas: 285460, meta: 250000, pedidos: 229, ticketMedio: 1245 },
    { mes: 'Jan', vendas: 320000, meta: 280000, pedidos: 258, ticketMedio: 1240 },
    { mes: 'Fev', vendas: 295000, meta: 280000, pedidos: 238, ticketMedio: 1239 }
  ],
  channels: [
    { name: 'Online', value: 142350, percentage: 49.8, color: '#3b82f6' },
    { name: 'Loja Física', value: 143110, percentage: 50.2, color: '#f97316' }
  ],
  products: [
    { categoria: 'Eletrônicos', vendas: 98500, crescimento: 15.2 },
    { categoria: 'Roupas', vendas: 67800, crescimento: 22.1 },
    { categoria: 'Casa & Jardim', vendas: 54200, crescimento: 8.9 },
    { categoria: 'Esportes', vendas: 42960, crescimento: 31.5 },
    { categoria: 'Livros', vendas: 22000, crescimento: -5.2 }
  ],
  regions: [
    { regiao: 'Sudeste', vendas: 142800, participacao: 50.1 },
    { regiao: 'Sul', vendas: 71450, participacao: 25.0 },
    { regiao: 'Nordeste', vendas: 42900, participacao: 15.0 },
    { regiao: 'Centro-Oeste', vendas: 17100, participacao: 6.0 },
    { regiao: 'Norte', vendas: 11210, participacao: 3.9 }
  ]
});

// Componente MetricCard
interface MetricCardProps {
  title: string;
  value: string | number;
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
          <h3 className="text-2xl font-bold text-text-high">{value}</h3>
          {description && <p className="text-xs text-text-low/80">{description}</p>}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

// Componente para cards de insights 
interface InsightCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  percentage: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
}

function InsightCard({ title, value, subtitle, trend, percentage, icon: Icon, bgColor, textColor }: InsightCardProps) {
  return (
    <Card className={cn(designSystem.surfaces.premium, "overflow-hidden group hover:scale-105 transition-all duration-300")}>
      <CardContent className="p-6 relative">
        <div className={cn("absolute inset-0 opacity-5", bgColor)} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-xl", bgColor, "bg-opacity-15")}>
              <Icon className={cn("w-6 h-6", textColor)} />
            </div>
            <Badge variant="outline" className={cn(
              "text-xs font-bold",
              trend === 'up' && "bg-semantic-success/15 text-semantic-success border-semantic-success/30",
              trend === 'down' && "bg-semantic-error/15 text-semantic-error border-semantic-error/30",
              trend === 'neutral' && "bg-surface-1 text-text-low"
            )}>
              {trend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
              {percentage}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-low uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-text-high">{value}</h3>
            <p className="text-xs text-text-low/80">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('this-month');
  const [activeTab, setActiveTab] = useState('vendas');
  const [loadingStates, setLoadingStates] = useState({
    vendas: false, estoque: false, clientes: false, 
    operacoes: false, marketing: false, financeiro: false
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const isMasterUser = true;
  
  // Dados simulados
  const salesData = getSalesData();

  const loadTabData = async (tabName: string) => {
    setLoadingStates(prev => ({ ...prev, [tabName]: true }));
    setErrors(prev => ({ ...prev, [tabName]: null }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      setErrors(prev => ({ ...prev, [tabName]: 'Erro ao carregar dados' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [tabName]: false }));
    }
  };

  useEffect(() => { loadTabData(activeTab); }, [activeTab, period]);

  if (!isMasterUser) {
    return (
      <div className="bg-surface-0 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-semantic-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-high mb-2">Acesso Restrito</h2>
          <p className="text-text-low">Este dashboard é exclusivo para usuários MASTER.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-surface-0 min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-7xl min-h-full">
        
        {/* Header Principal MASTER */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-accent-primary via-accent-primary/90 to-accent-secondary rounded-xl shadow-xl">
                  <BarChart3 className="h-7 w-7 text-surface-0" />
                </div>
                <div>
                  <h1 className={cn(designSystem.typography.title, "text-text-high")}>Dashboard MASTER</h1>
                  <p className="text-lg text-text-low font-medium">Controle total do negócio • CRM ADDS + Integrações</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[200px] bg-surface-1/95 backdrop-blur-xl border-accent-primary/20 shadow-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                  <SelectItem value="this-month">Mês atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-surface-1/95 backdrop-blur-xl border-accent-primary/20 hover:bg-accent-primary/10 shadow-lg" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />Atualizar Tudo
              </Button>
            </div>
          </div>
        </div>

        {/* Navegação de 6 Abas MASTER */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-surface-1/95 backdrop-blur-xl border border-accent-primary/20 shadow-xl rounded-xl p-2 h-auto sticky top-4 z-20">
            <TabsTrigger value="vendas" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <DollarSign className="h-4 w-4" /><span className="font-semibold text-sm">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <Package className="h-4 w-4" /><span className="font-semibold text-sm">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <Users className="h-4 w-4" /><span className="font-semibold text-sm">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="operacoes" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <Workflow className="h-4 w-4" /><span className="font-semibold text-sm">Operações</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <Target className="h-4 w-4" /><span className="font-semibold text-sm">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 hover:bg-accent-primary/10">
              <DollarSign className="h-4 w-4" /><span className="font-semibold text-sm">Financeiro</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA VENDAS - VERSÃO ROBUSTA */}
          <TabsContent value="vendas" className="space-y-8">
            <div className="animate-in fade-in slide-in-from-bottom duration-500">
              
              {/* KPIs Principais - Cards de Insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <InsightCard 
                  title="Receita Total"
                  value="R$ 285.460"
                  subtitle="Vendas totais no período"
                  trend="up"
                  percentage="+18.2%"
                  icon={DollarSign}
                  bgColor="bg-accent-primary"
                  textColor="text-accent-primary"
                />
                <InsightCard 
                  title="Ticket Médio"
                  value="R$ 1.245"
                  subtitle="Valor médio por transação"
                  trend="up"
                  percentage="+5.8%"
                  icon={TrendingUp}
                  bgColor="bg-semantic-success"
                  textColor="text-semantic-success"
                />
                <InsightCard 
                  title="Total Pedidos"
                  value="229"
                  subtitle="Pedidos realizados"
                  trend="up"
                  percentage="+12%"
                  icon={Package}
                  bgColor="bg-accent-secondary"
                  textColor="text-accent-secondary"
                />
                <InsightCard 
                  title="Taxa Conversão"
                  value="3.8%"
                  subtitle="Visitantes que compraram"
                  trend="up"
                  percentage="+0.4%"
                  icon={Target}
                  bgColor="bg-accent-tertiary"
                  textColor="text-accent-tertiary"
                />
              </div>

              {/* Seção de Filtros Avançados */}
              <Card className={designSystem.surfaces.glass}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-accent-primary" />
                      <span className="font-medium text-text-high">Análise Detalhada</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary">Por Canal</Badge>
                      <Badge variant="secondary" className="bg-accent-secondary/10 text-accent-secondary">Por Região</Badge>
                      <Badge variant="secondary" className="bg-accent-tertiary/10 text-accent-tertiary">Por Categoria</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos Principais - Layout 2x2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* Gráfico 1: Evolução de Vendas vs Meta */}
                <Card className={designSystem.surfaces.premium}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-accent-primary" />
                      Evolução de Vendas vs Meta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStates.vendas ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={salesData.evolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                `R$ ${Number(value).toLocaleString()}`,
                                name === 'vendas' ? 'Vendas' : 'Meta'
                              ]}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="vendas" 
                              stroke={CHART_COLORS.primary}
                              strokeWidth={3}
                              name="Vendas Realizadas"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="meta" 
                              stroke={CHART_COLORS.warning}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="Meta"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico 2: Distribuição por Canal */}
                <Card className={designSystem.surfaces.premium}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieIcon className="h-5 w-5 text-accent-primary" />
                      Vendas por Canal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStates.vendas ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={salesData.channels}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={60}
                              dataKey="value"
                              label={({ name, percentage }) => `${name}: ${percentage}%`}
                            >
                              {salesData.channels.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Vendas']}
                              labelStyle={{ color: '#1f2937' }}
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Cards de resumo dos canais */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="p-3 bg-accent-primary/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="h-4 w-4 text-accent-primary" />
                              <span className="text-sm font-medium text-text-high">Online</span>
                            </div>
                            <p className="text-lg font-bold text-accent-primary">R$ 142.350</p>
                            <p className="text-xs text-text-low">49.8% do total</p>
                          </div>
                          <div className="p-3 bg-accent-secondary/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Store className="h-4 w-4 text-accent-secondary" />
                              <span className="text-sm font-medium text-text-high">Física</span>
                            </div>
                            <p className="text-lg font-bold text-accent-secondary">R$ 143.110</p>
                            <p className="text-xs text-text-low">50.2% do total</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico 3: Performance por Categoria */}
                <Card className={designSystem.surfaces.premium}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-accent-primary" />
                      Performance por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStates.vendas ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesData.products} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="categoria" type="category" width={100} />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'vendas' ? `R$ ${Number(value).toLocaleString()}` : `${value}%`,
                                name === 'vendas' ? 'Vendas' : 'Crescimento'
                              ]}
                              labelStyle={{ color: '#1f2937' }}
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="vendas" 
                              fill={CHART_COLORS.primary}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gráfico 4: Vendas por Região */}
                <Card className={designSystem.surfaces.premium}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-accent-primary" />
                      Distribuição Regional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStates.vendas ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesData.regions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis dataKey="regiao" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Vendas']}
                              labelStyle={{ color: '#1f2937' }}
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="vendas" 
                              fill={CHART_COLORS.tertiary}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        
                        {/* Lista de regiões */}
                        <div className="mt-4 space-y-2">
                          {salesData.regions.map((region, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-surface-0/50 rounded">
                              <span className="text-sm font-medium text-text-high">{region.regiao}</span>
                              <div className="text-right">
                                <span className="text-sm font-bold text-accent-tertiary">
                                  R$ {region.vendas.toLocaleString()}
                                </span>
                                <span className="text-xs text-text-low ml-2">
                                  ({region.participacao}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Insights e Recomendações */}
              <Card className={cn(designSystem.surfaces.premium, "border-accent-primary/30")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent-primary" />
                    Insights Inteligentes & Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-semantic-success/10 rounded-lg border border-semantic-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-semantic-success" />
                        <span className="font-medium text-semantic-success">Destaque Positivo</span>
                      </div>
                      <p className="text-sm text-text-high">
                        <strong>Vendas online cresceram 22.4%</strong> vs período anterior. 
                        Estratégia digital está superando expectativas.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-accent-secondary/10 rounded-lg border border-accent-secondary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-accent-secondary" />
                        <span className="font-medium text-accent-secondary">Oportunidade</span>
                      </div>
                      <p className="text-sm text-text-high">
                        <strong>Região Norte com apenas 3.9%</strong> de participação. 
                        Potencial para expansão de market share.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-accent-tertiary/10 rounded-lg border border-accent-tertiary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-accent-tertiary" />
                        <span className="font-medium text-accent-tertiary">Ação Recomendada</span>
                      </div>
                      <p className="text-sm text-text-high">
                        <strong>Categoria Esportes com +31.5%</strong> de crescimento. 
                        Considere aumentar investimento em marketing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA ESTOQUE */}
          <TabsContent value="estoque" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard title="Valor Total Estoque" value="R$ 1.245.680" change="+5.2%" trend="up" icon={Package} description="Valor total em estoque" isLoading={loadingStates.estoque} error={errors.estoque} />
              <MetricCard title="Giro de Estoque" value="4.2x" change="+0.3x" trend="up" icon={Repeat} description="Renovação por período" isLoading={loadingStates.estoque} error={errors.estoque} />
              <MetricCard title="Produtos em Falta" value="12" change="-5" trend="up" icon={AlertTriangle} description="Rupturas de estoque" isLoading={loadingStates.estoque} error={errors.estoque} />
              <MetricCard title="Produtos Parados" value="R$ 89.250" change="-12.4%" trend="up" icon={Clock} description="Estoque sem movimentação" isLoading={loadingStates.estoque} error={errors.estoque} />
              <MetricCard title="Mais Vendidos" value="245 itens" change="+18" trend="up" icon={TrendingUp} description="Top produtos" isLoading={loadingStates.estoque} error={errors.estoque} />
              <MetricCard title="Menos Vendidos" value="58 itens" change="-8" trend="up" icon={TrendingDown} description="Baixa rotatividade" isLoading={loadingStates.estoque} error={errors.estoque} />
            </div>
          </TabsContent>

          {/* ABA CLIENTES */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard title="Clientes Ativos" value="1.847" change="+125" trend="up" icon={Users} description="Base ativa de clientes" isLoading={loadingStates.clientes} error={errors.clientes} />
              <MetricCard title="Clientes Novos" value="89" change="+22%" trend="up" icon={Sparkles} description="Novos no período" isLoading={loadingStates.clientes} error={errors.clientes} />
              <MetricCard title="LTV Médio" value="R$ 2.850" change="+8.5%" trend="up" icon={DollarSign} description="Lifetime Value" isLoading={loadingStates.clientes} error={errors.clientes} />
              <MetricCard title="NPS Score" value="78" change="+5 pontos" trend="up" icon={Star} description="Net Promoter Score" isLoading={loadingStates.clientes} error={errors.clientes} />
              <MetricCard title="Satisfação" value="4.6/5" change="+0.2" trend="up" icon={CheckCircle} description="Avaliação média" isLoading={loadingStates.clientes} error={errors.clientes} />
              <MetricCard title="Taxa de Retenção" value="84.2%" change="+3.1%" trend="up" icon={Repeat} description="Clientes recorrentes" isLoading={loadingStates.clientes} error={errors.clientes} />
            </div>
          </TabsContent>

          {/* ABA OPERAÇÕES */}
          <TabsContent value="operacoes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard title="Tempo Médio Entrega" value="4.2 dias" change="-0.5 dias" trend="up" icon={Timer} description="Prazo médio de entrega" isLoading={loadingStates.operacoes} error={errors.operacoes} />
              <MetricCard title="Custos Logísticos" value="R$ 18.450" change="+2.1%" trend="down" icon={DollarSign} description="Frete + armazenamento" isLoading={loadingStates.operacoes} error={errors.operacoes} />
              <MetricCard title="Taxa de Devolução" value="2.8%" change="-0.4%" trend="up" icon={Repeat} description="Produtos devolvidos" isLoading={loadingStates.operacoes} error={errors.operacoes} />
              <MetricCard title="Pedidos Personalizados" value="156" change="+18" trend="up" icon={Settings2} description="Customizações ativas" isLoading={loadingStates.operacoes} error={errors.operacoes} />
              <MetricCard title="Tempo em Aprovação" value="1.8 dias" change="-0.3 dias" trend="up" icon={CheckCircle} description="Etapa de aprovação" isLoading={loadingStates.operacoes} error={errors.operacoes} />
              <MetricCard title="Tempo em Produção" value="2.4 dias" change="-0.2 dias" trend="up" icon={Workflow} description="Etapa de fabricação" isLoading={loadingStates.operacoes} error={errors.operacoes} />
            </div>
          </TabsContent>

          {/* ABA MARKETING */}
          <TabsContent value="marketing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard title="Investimento Total" value="R$ 45.280" change="+12.5%" trend="up" icon={DollarSign} description="Campanhas ativas" isLoading={loadingStates.marketing} error={errors.marketing} />
              <MetricCard title="ROI Marketing" value="425%" change="+28%" trend="up" icon={TrendingUp} description="Retorno sobre investimento" isLoading={loadingStates.marketing} error={errors.marketing} />
              <MetricCard title="Taxa de Conversão" value="3.8%" change="+0.4%" trend="up" icon={Target} description="Conversão de campanhas" isLoading={loadingStates.marketing} error={errors.marketing} />
              <MetricCard title="CAC Médio" value="R$ 145" change="-R$ 15" trend="up" icon={Users} description="Custo aquisição cliente" isLoading={loadingStates.marketing} error={errors.marketing} />
              <MetricCard title="Leads Gerados" value="1.247" change="+156" trend="up" icon={Activity} description="Novos leads" isLoading={loadingStates.marketing} error={errors.marketing} />
              <MetricCard title="Taxa de Engajamento" value="7.2%" change="+1.1%" trend="up" icon={Sparkles} description="Interação com conteúdo" isLoading={loadingStates.marketing} error={errors.marketing} />
            </div>
          </TabsContent>

          {/* ABA FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard title="Margem Bruta" value="68.5%" change="+2.1%" trend="up" icon={DollarSign} description="Margem de lucro bruto" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              <MetricCard title="Margem Líquida" value="24.8%" change="+1.5%" trend="up" icon={TrendingUp} description="Margem de lucro líquido" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              <MetricCard title="Contas a Receber" value="R$ 185.450" change="+5.2%" trend="up" icon={Clock} description="Valores a receber" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              <MetricCard title="Contas a Pagar" value="R$ 98.250" change="-8.1%" trend="up" icon={AlertTriangle} description="Valores a pagar" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              <MetricCard title="Fluxo de Caixa" value="R$ 542.680" change="+18.5%" trend="up" icon={Activity} description="Saldo disponível" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              <MetricCard title="Saldos Consolidados" value="R$ 789.420" change="+12.3%" trend="up" icon={PieIcon} description="Todas as contas" isLoading={loadingStates.financeiro} error={errors.financeiro} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-high mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent-primary" />
                Saldos por Banco
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard title="Banco do Brasil" value="R$ 245.680" change="+8.2%" trend="up" icon={DollarSign} description="Conta corrente" isLoading={loadingStates.financeiro} error={errors.financeiro} />
                <MetricCard title="Cresol" value="R$ 128.450" change="+5.1%" trend="up" icon={DollarSign} description="Conta empresarial" isLoading={loadingStates.financeiro} error={errors.financeiro} />
                <MetricCard title="Magalu Pay" value="R$ 89.230" change="+12.8%" trend="up" icon={DollarSign} description="Carteira digital" isLoading={loadingStates.financeiro} error={errors.financeiro} />
                <MetricCard title="Olist" value="R$ 156.890" change="+15.5%" trend="up" icon={DollarSign} description="Marketplace" isLoading={loadingStates.financeiro} error={errors.financeiro} />
                <MetricCard title="Unicred" value="R$ 98.670" change="+6.8%" trend="up" icon={DollarSign} description="Cooperativa" isLoading={loadingStates.financeiro} error={errors.financeiro} />
                <MetricCard title="Pagar.me" value="R$ 70.500" change="+22.1%" trend="up" icon={DollarSign} description="Gateway pagamento" isLoading={loadingStates.financeiro} error={errors.financeiro} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}