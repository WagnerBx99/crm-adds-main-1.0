import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useKanban } from '@/contexts/KanbanContext';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Database, Activity, Plus, Star, Trash2, Zap, Eye, Bug, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Order } from '@/types';

export default function KanbanDebugPanel() {
  const { state, dispatch, refreshFromStorage, addPublicOrder } = useKanban();
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  const publicOrders = state.orders.filter(order => 
    order.labels?.includes('ORCAMENTO_PUBLICO')
  );

  const storedQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');

  // Auto refresh a cada 10 segundos se ativado
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshFromStorage();
      setRefreshCount(prev => prev + 1);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshFromStorage]);

  const handleTestOrder = async () => {
    const testOrderData = {
      title: `Teste Debug - ${new Date().toLocaleTimeString('pt-BR')}`,
      description: 'Pedido de teste criado pelo debug panel',
      customer: {
        id: `test-customer-${Date.now()}`,
        name: 'Cliente Teste Debug',
        email: 'teste@debug.com',
        phone: '(11) 99999-9999',
        company: 'Debug Corp',
        createdAt: new Date()
      },
      status: 'FAZER' as const,
      priority: 'medium' as const,
      products: [{
        id: 'test-product',
        name: 'Produto Teste',
        quantity: 1
      }],
      personalizationDetails: 'Teste de personalização via debug',
      customerDetails: 'Dados de teste do cliente',
      labels: ['ORCAMENTO_PUBLICO'] as any[],
      comments: [],
      attachments: [],
      artworkImages: [],
      artworkComments: []
    };

    try {
      await addPublicOrder(testOrderData);
      toast.success('Pedido de teste criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar pedido de teste');
      console.error('Erro no teste:', error);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('publicQuotes');
    toast.success('LocalStorage limpo');
    refreshFromStorage();
  };

  const createTestOrder = () => {
    const testOrder: Order = {
      id: `test-${Date.now()}`,
      title: `Teste Debug - Cliente ${new Date().getHours()}:${new Date().getMinutes()}`,
      description: 'Pedido criado via debug panel para teste',
      customer: {
        id: `customer-${Date.now()}`,
        name: `Cliente Teste ${new Date().getHours()}:${new Date().getMinutes()}`,
        email: 'teste@debug.com',
        phone: '(11) 99999-9999',
        company: 'Debug Company',
        createdAt: new Date()
      },
      status: 'FAZER',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [{
        id: `history-${Date.now()}`,
        date: new Date(),
        status: 'FAZER',
        user: 'Debug',
        comment: 'Pedido criado via debug panel'
      }],
      labels: ['ORCAMENTO_PUBLICO'],
      comments: [],
      attachments: [],
      artworkImages: [],
      artworkComments: []
    };
    
    dispatch({
      type: 'ADD_ORDER',
      payload: testOrder
    });
    
    toast.success('Pedido de teste criado!', {
      description: 'Um novo pedido foi adicionado na coluna FAZER'
    });
  };

  // Nova função para criar orçamento público no localStorage
  const createTestPublicQuote = () => {
    const testQuote = {
      id: `quote-test-${Date.now()}`,
      customer: {
        name: `Cliente Público ${new Date().getHours()}:${new Date().getMinutes()}`,
        email: 'cliente@publico.com',
        phone: '(11) 98765-4321',
        company: 'Empresa Pública'
      },
      product: {
        id: 'ADDS_IMPLANT',
        name: 'ADDS Implant'
      },
      customization: {
        quantity: '50',
        color: '#0066cc',
        finish: 'Brilhante',
        details: 'Personalização de teste via debug'
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Buscar orçamentos existentes
    const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
    
    // Adicionar novo orçamento
    const updatedQuotes = [...existingQuotes, testQuote];
    localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
    
    console.log('🧪 Orçamento de teste criado:', testQuote);
    console.log('📦 Total de orçamentos no localStorage:', updatedQuotes.length);
    
    // Forçar sincronização
    refreshFromStorage();
    
    toast.success('🎉 Orçamento público de teste criado!', {
      description: 'Verifique a coluna FAZER em alguns segundos...',
      duration: 4000
    });
  };

  // Função para verificar dados do localStorage
  const checkLocalStorageData = () => {
    const quotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
    console.log('📊 Dados do localStorage:', quotes);
    console.log('📈 Total de orçamentos:', quotes.length);
    
    if (quotes.length > 0) {
      console.log('🔍 Último orçamento:', quotes[quotes.length - 1]);
    }
    
    toast.info(`LocalStorage tem ${quotes.length} orçamentos`, {
      description: 'Verifique o console para detalhes'
    });
  };

  // Função para teste completo do fluxo
  const runCompleteTest = () => {
    console.log('🧪 Iniciando teste completo do fluxo...');
    
    // 1. Limpar dados existentes
    localStorage.removeItem('publicQuotes');
    console.log('🧹 LocalStorage limpo');
    
    // 2. Criar orçamento de teste
    const testQuote = {
      id: `quote-complete-test-${Date.now()}`,
      customer: {
        name: 'Cliente Teste Completo',
        email: 'teste@completo.com',
        phone: '(11) 99999-9999',
        company: 'Empresa Teste'
      },
      product: {
        id: 'ADDS_IMPLANT',
        name: 'ADDS Implant'
      },
      customization: {
        quantity: '100',
        color: '#ff6600',
        finish: 'Fosco',
        details: 'Teste completo do sistema'
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // 3. Salvar no localStorage
    localStorage.setItem('publicQuotes', JSON.stringify([testQuote]));
    console.log('💾 Orçamento salvo no localStorage:', testQuote);
    
    // 4. Forçar sincronização
    refreshFromStorage();
    console.log('🔄 Sincronização forçada');
    
    // 5. Verificar resultado após 2 segundos
    setTimeout(() => {
      const currentOrders = state.orders;
      const publicOrders = currentOrders.filter(order => 
        order.labels?.includes('ORCAMENTO_PUBLICO')
      );
      
      console.log('📊 Resultado do teste:');
      console.log('- Total de pedidos:', currentOrders.length);
      console.log('- Pedidos públicos:', publicOrders.length);
      console.log('- Último pedido criado:', currentOrders[currentOrders.length - 1]);
      
      if (publicOrders.length > 0) {
        toast.success('✅ Teste completo bem-sucedido!', {
          description: 'O orçamento apareceu no Kanban'
        });
      } else {
        toast.error('❌ Teste falhou', {
          description: 'O orçamento não apareceu no Kanban'
        });
      }
    }, 2000);
    
    toast.info('🧪 Teste completo iniciado', {
      description: 'Aguarde 2 segundos para o resultado...'
    });
  };

  // Função para simular múltiplos orçamentos
  const createMultipleQuotes = () => {
    const quotes = [];
    for (let i = 1; i <= 5; i++) {
      quotes.push({
        id: `quote-multi-${Date.now()}-${i}`,
        customer: {
          name: `Cliente Múltiplo ${i}`,
          email: `cliente${i}@teste.com`,
          phone: `(11) 9999-999${i}`,
          company: `Empresa ${i}`
        },
        product: {
          id: i % 2 === 0 ? 'ADDS_ULTRA' : 'ADDS_IMPLANT',
          name: i % 2 === 0 ? 'ADDS Ultra' : 'ADDS Implant'
        },
        customization: {
          quantity: (i * 10).toString(),
          color: i % 2 === 0 ? '#ff0000' : '#0000ff',
          details: `Personalização múltipla ${i}`
        },
        timestamp: new Date(Date.now() - i * 60000).toISOString(), // Diferentes timestamps
        status: 'pending'
      });
    }
    
    localStorage.setItem('publicQuotes', JSON.stringify(quotes));
    refreshFromStorage();
    
    toast.success('🎯 5 orçamentos de teste criados!', {
      description: 'Aguarde a sincronização...'
    });
  };

  // Função para inspecionar orçamentos em detalhes
  const inspectQuotes = () => {
    const quotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
    console.log('🔍 INSPEÇÃO DETALHADA DOS ORÇAMENTOS:');
    console.log('📊 Total de orçamentos:', quotes.length);
    
    quotes.forEach((quote: any, index: number) => {
      console.log(`\n🔍 Orçamento ${index + 1}:`);
      console.log('- ID:', quote?.id);
      console.log('- Customer:', quote?.customer);
      console.log('- Customer Name:', quote?.customer?.name || quote?.customer?.nome);
      console.log('- Product:', quote?.product);
      console.log('- Product Name:', quote?.product?.name);
      console.log('- Products Array:', quote?.products);
      console.log('- Timestamp:', quote?.timestamp);
      console.log('- Customization:', quote?.customization);
      console.log('- Status:', quote?.status);
      
      // Validação detalhada com suporte a múltiplas estruturas
      const hasValidCustomer = !!(quote?.customer?.name || quote?.customer?.nome);
      const hasValidProduct = !!(quote?.product?.name || (quote?.products && quote.products.length > 0));
      const hasValidTimestamp = !!quote?.timestamp;
      
      console.log('✅ Validações:');
      console.log('  - Customer válido:', hasValidCustomer);
      console.log('    * customer.name:', !!quote?.customer?.name);
      console.log('    * customer.nome:', !!quote?.customer?.nome);
      console.log('  - Product válido:', hasValidProduct);
      console.log('    * product.name:', !!quote?.product?.name);
      console.log('    * products array:', !!(quote?.products && quote.products.length > 0));
      console.log('  - Timestamp válido:', hasValidTimestamp);
      console.log('  - SERIA ACEITO:', hasValidCustomer && hasValidProduct && hasValidTimestamp);
      
      if (!hasValidCustomer || !hasValidProduct || !hasValidTimestamp) {
        console.log('❌ MOTIVO DA REJEIÇÃO:');
        if (!hasValidCustomer) console.log('  - Falta customer.name OU customer.nome');
        if (!hasValidProduct) console.log('  - Falta product.name OU products array');
        if (!hasValidTimestamp) console.log('  - Falta timestamp');
      }
      
      // Mostrar estrutura normalizada que seria criada
      if (hasValidCustomer && hasValidProduct && hasValidTimestamp) {
        const customerData = {
          name: quote.customer.name || quote.customer.nome,
          email: quote.customer.email,
          phone: quote.customer.phone || quote.customer.fone,
          company: quote.customer.company || quote.customer.nome || ''
        };
        
        let productInfo;
        if (quote.product) {
          productInfo = quote.product;
        } else if (quote.products && quote.products.length > 0) {
          productInfo = {
            id: quote.products[0].id || quote.products[0].product_id,
            name: quote.products[0].name || quote.products[0].product_name || 'Produto'
          };
        }
        
        console.log('🔄 DADOS NORMALIZADOS:');
        console.log('  - Cliente:', customerData);
        console.log('  - Produto:', productInfo);
      }
    });
    
    toast.info(`Inspecionados ${quotes.length} orçamentos`, {
      description: 'Verifique o console para detalhes completos'
    });
  };

  // Função para criar orçamento com estrutura garantidamente válida
  const createValidQuote = () => {
    const validQuote = {
      id: `quote-valid-${Date.now()}`,
      customer: {
        name: 'Cliente Válido Teste',
        email: 'valido@teste.com',
        phone: '(11) 99999-9999',
        company: 'Empresa Válida'
      },
      product: {
        id: 'ADDS_IMPLANT',
        name: 'ADDS Implant'
      },
      customization: {
        quantity: '25',
        color: '#00ff00',
        details: 'Orçamento com estrutura válida garantida'
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Buscar orçamentos existentes
    const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
    
    // Adicionar novo orçamento
    const updatedQuotes = [...existingQuotes, validQuote];
    localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
    
    console.log('✅ Orçamento VÁLIDO criado:', validQuote);
    console.log('📦 Total de orçamentos no localStorage:', updatedQuotes.length);
    
    // Forçar sincronização
    refreshFromStorage();
    
    toast.success('✅ Orçamento VÁLIDO criado!', {
      description: 'Este deve aparecer no Kanban com certeza',
      duration: 4000
    });
  };

  // Função para testar estrutura que estava sendo rejeitada
  const testRejectedStructure = () => {
    const rejectedStructureQuote = {
      id: `quote-rejected-test-${Date.now()}`,
      customer: {
        nome: 'Júnior Cesar Alves Cabral', // Era rejeitado antes
        email: 'contato.cabral@gmail.com',
        fone: '(48) 99916-8070', // Era rejeitado antes
        cpf_cnpj: '070.486.659-55',
        tipo_pessoa: '1'
      },
      products: [{ // Estrutura products array
        id: 'ADDS_IMPLANT',
        name: 'ADDS Implant',
        quantity: 1
      }],
      customization: {
        telefone: '(48) 99999-9999',
        whatsapp: '',
        cidade: '',
        estado: ''
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Buscar orçamentos existentes
    const existingQuotes = JSON.parse(localStorage.getItem('publicQuotes') || '[]');
    
    // Adicionar novo orçamento
    const updatedQuotes = [...existingQuotes, rejectedStructureQuote];
    localStorage.setItem('publicQuotes', JSON.stringify(updatedQuotes));
    
    console.log('🧪 Orçamento com estrutura REJEITADA criado:', rejectedStructureQuote);
    console.log('📦 Total de orçamentos no localStorage:', updatedQuotes.length);
    
    // Forçar sincronização
    refreshFromStorage();
    
    toast.success('🧪 Teste de Estrutura Rejeitada!', {
      description: 'Orçamento com customer.nome e customer.fone criado - deve ser aceito agora!',
      duration: 4000
    });
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg"
          size="sm"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl border-yellow-400 bg-white">
        <CardHeader className="bg-yellow-50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              Debug Panel
              {autoRefresh && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Auto-refresh ativo" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "text-green-600" : "text-gray-400"}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {/* Estado Geral */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Estado do Sistema
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Total Pedidos:</span>
                <Badge variant="secondary">{state.orders.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Orçamentos Públicos:</span>
                <Badge className="bg-cyan-500">{publicOrders.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>LocalStorage:</span>
                <Badge variant="outline">{storedQuotes.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge className={state.isLoading ? 'bg-orange-500' : 'bg-green-500'}>
                  {state.isLoading ? 'Carregando' : 'OK'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Auto-refresh:</span>
                <Badge className={autoRefresh ? 'bg-green-500' : 'bg-gray-500'}>
                  {autoRefresh ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Sincronizações:</span>
                <Badge variant="outline">{refreshCount}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Últimas Atualizações */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Última Sincronização
            </h4>
            <p className="text-sm text-gray-600">
              {state.lastSyncTime ? 
                state.lastSyncTime.toLocaleString('pt-BR') : 
                'Nunca sincronizado'
              }
            </p>
          </div>

          <Separator />

          {/* Colunas do Kanban */}
          <div>
            <h4 className="font-medium mb-2">Status das Colunas</h4>
            <div className="space-y-1 text-sm">
              {state.columns.map(column => (
                <div key={column.id} className="flex justify-between">
                  <span>{column.title}:</span>
                  <Badge variant="outline">{column.orders.length}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Diagnósticos */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Diagnósticos
            </h4>
            <div className="space-y-2 text-sm">
              {storedQuotes.length > publicOrders.length && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>LocalStorage tem mais itens que o kanban</span>
                </div>
              )}
              
              {publicOrders.length === 0 && storedQuotes.length > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Orçamentos não estão aparecendo no kanban</span>
                </div>
              )}
              
              {state.lastSyncTime && (Date.now() - state.lastSyncTime.getTime()) > 30000 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>Última sincronização muito antiga</span>
                </div>
              )}

              {publicOrders.length === storedQuotes.length && publicOrders.length > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sistema funcionando corretamente</span>
                </div>
              )}

              {state.orders.length === 0 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Eye className="h-3 w-3" />
                  <span>Nenhum pedido no sistema</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Ações de Debug */}
          <div>
            <h4 className="font-medium mb-2">Ações de Debug</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={runCompleteTest}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 col-span-2"
              >
                <Zap className="h-3 w-3 mr-1" />
                Teste Completo
              </Button>
              
              <Button
                onClick={createMultipleQuotes}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 col-span-2"
              >
                <Settings className="h-3 w-3 mr-1" />
                5 Orçamentos de Teste
              </Button>
              
              <Button
                onClick={createValidQuote}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Orçamento Válido
              </Button>
              
              <Button
                onClick={testRejectedStructure}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Estrutura Rejeitada
              </Button>
              
              <Button
                onClick={handleTestOrder}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Criar Pedido
              </Button>
              
              <Button
                onClick={createTestPublicQuote}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
              >
                <Star className="h-3 w-3 mr-1" />
                Orçamento Público
              </Button>
              
              <Button
                onClick={checkLocalStorageData}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              >
                <Database className="h-3 w-3 mr-1" />
                Verificar Dados
              </Button>
              
              <Button
                onClick={inspectQuotes}
                size="sm"
                className="bg-pink-600 hover:bg-pink-700 text-white text-xs h-8"
              >
                <Eye className="h-3 w-3 mr-1" />
                Inspecionar
              </Button>
              
              <Button
                onClick={refreshFromStorage}
                size="sm"
                variant="outline"
                className="text-xs h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sincronizar
              </Button>
              
              <Button
                onClick={clearStorage}
                size="sm"
                variant="destructive"
                className="text-xs h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Logs dos últimos orçamentos */}
          {storedQuotes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Últimos Orçamentos</h4>
                <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                  {storedQuotes.slice(-5).reverse().map((quote: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                      <span className="truncate font-medium">{quote.customer?.name || 'Sem nome'}</span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(quote.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Informações de performance */}
          <Separator />
          <div className="text-xs text-gray-500 text-center">
            <p>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Versão: Debug Panel v2.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 