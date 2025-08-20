import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare,
  BarChart3,
  Globe,
  ExternalLink, 
  Settings, 
  Package, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link2,
  Copy,
  Eye,
  Calendar,
  Activity,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { PublicQuotesManager } from '@/components/admin/PublicQuotesManager';
import { userService } from '@/lib/services/userService';
import { rolePermissions } from '@/types';
import { useTheme, ThemeToggle } from '@/theme/ThemeProvider';

export default function Personalization() {
  const [activeTab, setActiveTab] = useState('quotes');
  const currentUser = userService.getCurrentUser();
  const { theme } = useTheme();

  // Verificar permissões do usuário
  const canManageQuotes = currentUser && 
    (currentUser.role === 'MASTER' || 
     rolePermissions[currentUser.role].canViewAllOrders ||
     rolePermissions[currentUser.role].canManageUsers);

  const canAccessSettings = currentUser && 
    (currentUser.role === 'MASTER' || 
     rolePermissions[currentUser.role].canAccessSettings);

  // Dados simulados para métricas
  const quotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
  const pendingQuotes = quotes.filter((q: any) => q.status === 'pending').length;
  const completedQuotes = quotes.filter((q: any) => q.status === 'completed').length;
  const totalQuotes = quotes.length;

  return (
    <div className="bg-surface-0 min-h-screen">
      {/* Container principal com padding adequado e altura mínima */}
      <div className="container mx-auto px-6 py-8 max-w-7xl min-h-full">
        
        {/* Header Moderno */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-primary rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-surface-0" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-text-high">
                    Central de Personalização
                  </h1>
                  <p className="text-lg text-text-low font-medium">
                    Gerencie solicitações e configure produtos personalizáveis
                  </p>
                </div>
              </div>
            </div>
            
            {/* Toggle de tema e ações rápidas */}
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                className="bg-surface-1 backdrop-blur-sm border-accent-primary/20 hover:bg-accent-primary/10 hover:border-accent-primary/40 transition-all duration-200"
                onClick={() => window.open('/orcamento', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Interface Pública
              </Button>
              {canAccessSettings && (
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/settings?tab=products'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Produtos
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navegação de abas modernizada */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 pb-8">
          <TabsList className="grid w-full grid-cols-3 bg-surface-1 backdrop-blur-sm border border-accent-primary/20 shadow-lg rounded-xl p-2 h-auto sticky top-4 z-10 mt-8">
            {canManageQuotes && (
              <TabsTrigger 
                value="quotes" 
                className="flex items-center gap-3 py-4 px-6 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 data-[state=active]:shadow-lg"
              >
                <MessageSquare className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Solicitações</div>
                  <div className="text-xs opacity-70">Principal</div>
                </div>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-3 py-4 px-6 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 data-[state=active]:shadow-lg"
            >
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Visão Geral</div>
                <div className="text-xs opacity-70">Analytics</div>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="public" 
              className="flex items-center gap-3 py-4 px-6 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-accent-primary data-[state=active]:text-surface-0 data-[state=active]:shadow-lg"
            >
              <Globe className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Interface Pública</div>
                <div className="text-xs opacity-70">Links públicos</div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Gerenciador de Solicitações - Aba Principal */}
          {canManageQuotes && (
            <TabsContent value="quotes" className="space-y-6">
              <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <PublicQuotesManager />
              </div>
            </TabsContent>
          )}

          {/* Visão Geral - Segunda aba */}
          <TabsContent value="overview" className="space-y-8">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
              {/* Produtos disponíveis */}
              <Card className="bg-surface-1 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-text-high">
                    <Package className="h-6 w-6 text-accent-primary" />
                    Produtos Personalizáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['ADDS Implant', 'ADDS Ultra', 'Raspador de Língua', 'Estojo de Viagem'].map((product, index) => (
                      <div key={product} className="p-4 bg-surface-0 rounded-xl border border-accent-primary/20 hover:border-accent-primary/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center text-surface-0 font-bold">
                            {product.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-high">{product}</p>
                            <p className="text-xs text-text-low">Ativo</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ferramentas de gestão */}
              <Card className="bg-surface-1 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-text-high">
                    <Settings className="h-6 w-6 text-accent-tertiary" />
                    Ferramentas de Gestão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canAccessSettings && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-6 flex flex-col items-start gap-3 bg-surface-0 hover:bg-accent-primary/10 border-accent-primary/20 hover:border-accent-primary/40 group transition-all duration-200"
                        onClick={() => window.location.href = '/settings?tab=products'}
                      >
                        <div className="p-3 bg-accent-primary/10 group-hover:bg-accent-primary/20 rounded-lg transition-colors">
                          <Package className="h-6 w-6 text-accent-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-text-high">Catálogo de Produtos</div>
                          <div className="text-sm text-text-low">Gerenciar produtos e opções</div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-accent-primary ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    )}
                    
                    {canManageQuotes && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-6 flex flex-col items-start gap-3 bg-surface-0 hover:bg-accent-primary/10 border-accent-primary/20 hover:border-accent-primary/40 group transition-all duration-200"
                        onClick={() => setActiveTab('quotes')}
                      >
                        <div className="p-3 bg-accent-primary/10 group-hover:bg-accent-primary/20 rounded-lg transition-colors">
                          <MessageSquare className="h-6 w-6 text-accent-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-text-high">Central de Solicitações</div>
                          <div className="text-sm text-text-low">Gerenciar orçamentos</div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-accent-primary ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      className="h-auto p-6 flex flex-col items-start gap-3 bg-surface-0 hover:bg-accent-primary/10 border-accent-primary/20 hover:border-accent-primary/40 group transition-all duration-200"
                      onClick={() => setActiveTab('public')}
                    >
                      <div className="p-3 bg-accent-primary/10 group-hover:bg-accent-primary/20 rounded-lg transition-colors">
                        <Globe className="h-6 w-6 text-accent-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-text-high">Interface Pública</div>
                        <div className="text-sm text-text-low">Gerenciar links públicos</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-accent-primary ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas avançadas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-surface-0 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-accent-primary" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {totalQuotes > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-accent-primary/10 rounded-lg">
                            <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Nova solicitação recebida</p>
                              <p className="text-xs text-text-low">Há 2 horas</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-accent-primary/20 rounded-lg">
                            <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Orçamento enviado</p>
                              <p className="text-xs text-text-low">Há 4 horas</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-text-low mx-auto mb-3" />
                          <p className="text-text-low">Nenhuma atividade recente</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-0 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-accent-primary" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Taxa de Resposta</span>
                          <span className="text-sm text-text-low">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Tempo Médio de Resposta</span>
                          <span className="text-sm text-text-low">2.5h</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Satisfação do Cliente</span>
                          <span className="text-sm text-text-low">4.8/5</span>
                        </div>
                        <Progress value={96} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Interface Pública - Terceira aba */}
          <TabsContent value="public" className="space-y-6">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
              {/* Gerenciamento de URLs públicas */}
              <Card className="bg-surface-0 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-text-high">
                    <Link2 className="h-6 w-6 text-accent-primary" />
                    Links Públicos Ativos
                  </CardTitle>
                  <p className="text-text-low">
                    URLs disponíveis para seus clientes solicitarem orçamentos
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { url: '/orcamento', label: 'URL Principal', status: 'Ativo', clicks: 156 },
                      { url: '/personalizar', label: 'URL Alternativa', status: 'Ativo', clicks: 89 },
                      { url: '/public/personalize', label: 'URL Pública', status: 'Ativo', clicks: 23 }
                    ].map((link, index) => (
                      <div key={index} className="p-4 bg-surface-1 rounded-lg border border-accent-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="bg-accent-primary text-accent-primary border-accent-primary">
                                {link.status}
                              </Badge>
                              <span className="font-semibold text-text-high">{link.label}</span>
                            </div>
                            <code className="text-sm bg-surface-0 px-3 py-1 rounded border text-text-high">
                              {window.location.origin}{link.url}
                            </code>
                            <p className="text-xs text-text-low mt-2">
                              {link.clicks} acessos este mês
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="bg-surface-0 hover:bg-accent-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + link.url);
                                // Aqui você pode adicionar uma notificação de sucesso
                              }}
                              className="bg-surface-0 hover:bg-accent-primary/10"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview da interface pública */}
              <Card className="bg-surface-0 backdrop-blur-sm border border-accent-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-accent-primary" />
                    Preview da Interface Pública
                  </CardTitle>
                  <p className="text-text-low">
                    Visualização da experiência do cliente
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-accent-primary/20 rounded-xl overflow-hidden bg-surface-0">
                    <div className="aspect-video">
                      <iframe 
                        src="/orcamento" 
                        className="w-full h-full border-0"
                        title="Interface Pública de Personalização"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-text-high">URLs disponíveis:</p>
                      <div className="text-text-low space-y-1">
                        <p>• {window.location.origin}/orcamento</p>
                        <p>• {window.location.origin}/personalizar</p>
                        <p>• {window.location.origin}/public/personalize</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => window.open('/orcamento', '_blank')}
                        className="bg-surface-0 hover:bg-accent-primary/10"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir em Nova Aba
                      </Button>
                      <Button 
                        onClick={() => location.reload()}
                        className="bg-accent-primary hover:bg-accent-primary/90"
                      >
                        Recarregar Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
