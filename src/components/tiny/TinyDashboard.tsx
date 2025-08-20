import React, { useState, useEffect } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { tinyConfig } from '../../lib/integrations/tiny/tinyConfig';
import { TINY_CONFIG } from '../../config';
import { StatusPedido } from '../../types/tiny';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import '../tiny/tinyStyles.css';

/**
 * Dashboard de integração com o Tiny ERP
 * 
 * Métodos disponíveis no tinyService:
 * - getClientes(): Busca clientes do Tiny
 * - getClienteById(): Obtém dados detalhados de um cliente
 * - createCliente(): Cria um novo cliente
 * - updateCliente(): Atualiza dados de um cliente
 * - getPedidos(): Busca pedidos do Tiny
 * - getPedidoById(): Obtém dados detalhados de um pedido
 * - updateStatusPedido(): Atualiza o status de um pedido
 * - listarProdutos(): Busca produtos do Tiny
 * - testConnection(): Testa a conexão com a API
 * - reinitialize(): Reinicializa a configuração do serviço
 */
const TinyDashboard: React.FC<{ onSync?: () => Promise<void> }> = ({ onSync }) => {
  const tinyService = useTinyService();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loadingSync, setLoadingSync] = useState(false);
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalPedidos: 0,
    pedidosAbertos: 0,
    ultimaSincronizacao: ''
  });

  // Verifica o status da conexão ao montar o componente
  useEffect(() => {
    checkConnection();
  }, []);

  // Função para testar a conexão com o Tiny
  const checkConnection = async () => {
    setConnectionStatus('checking');
    setConnectionError(null);
    
    try {
      console.log('Testando conexão com Tiny ERP...');
      const connected = await tinyService.testConnection();
      
      if (connected) {
        console.log('Conexão com Tiny ERP bem-sucedida!');
        setConnectionStatus('connected');
        // Carrega estatísticas após conexão bem-sucedida
        loadStats();
      } else {
        console.error('Falha na conexão com Tiny ERP');
        setConnectionStatus('disconnected');
        setConnectionError('Não foi possível estabelecer conexão com o Tiny ERP');
      }
    } catch (error: any) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus('disconnected');
      setConnectionError(error.message || 'Erro ao conectar com o Tiny ERP');
    }
  };

  // Função para carregar as estatísticas
  const loadStats = async () => {
    try {
      // Carregar total de clientes
      const clientes = await tinyService.getClientes({ registros_por_pagina: 1 });
      
      // Carregar total de pedidos (sem filtro de situacao para trazer TODOS)
      const pedidos = await tinyService.getPedidos({ registros_por_pagina: 1 });
      
      // Carregar pedidos pendentes - usando filtro explícito de situacao
      const pedidosAbertos = await tinyService.getPedidos({ 
        situacao: StatusPedido.PENDENTE,
        registros_por_pagina: 1 
      });
      
      // Atualizar estatísticas
      setStats({
        totalClientes: extractTotalCount(clientes),
        totalPedidos: extractTotalCount(pedidos),
        pedidosAbertos: extractTotalCount(pedidosAbertos),
        ultimaSincronizacao: new Date().toLocaleString('pt-BR')
      });
    } catch (error) {
      console.warn('[TinyDashboard] Não foi possível carregar estatísticas, exibindo zero:', error);
      setStats({ 
        totalClientes: 0, 
        totalPedidos: 0, 
        pedidosAbertos: 0,
        ultimaSincronizacao: new Date().toLocaleString('pt-BR')
      });
      // Não desconecta a integração, apenas mostra estatísticas zeradas
    }
  };

  // Função para sincronizar dados com o Tiny
  const handleSync = async () => {
    setLoadingSync(true);
    
    try {
      // Testar conexão com a API
      const isConnected = await tinyService.testConnection();
      
      if (!isConnected) {
        throw new Error('Não foi possível conectar com a API do Tiny');
      }
      
      console.log('[TinyDashboard] Sincronizando dados do Tiny...');
      
      // Sincronizar clientes - força a atualização
      console.log('[TinyDashboard] Sincronizando clientes...');
      await tinyService.getClientes({ registros_por_pagina: 100 }, true);
      
      // Sincronizar pedidos - sem filtro de situacao para trazer TODOS, força a atualização
      console.log('[TinyDashboard] Sincronizando pedidos...');
      const pedidosSincronizados = await tinyService.getPedidos({ registros_por_pagina: 100 }, true);
      console.log(`[TinyDashboard] Sincronizados ${pedidosSincronizados.length} pedidos`);
      
      // Carregar estatísticas após sincronização bem-sucedida
      await loadStats();
      
      // Finalizar sincronização
      setLoadingSync(false);
      setConnectionStatus('connected');
      setConnectionError(null);
      
      // Se houver callback de sincronização, chamá-lo
      if (onSync) {
        await onSync();
      }
    } catch (error: any) {
      console.error('[TinyDashboard] Erro na sincronização:', error);
      
      // Evitar desconexão por erros de "consulta vazia" ou resposta sem registros
      const errorMsg = error?.message || '';
      const isEmptyResultError = 
        errorMsg.includes('não retornou registros') || 
        errorMsg.includes('Nenhum registro encontrado') ||
        errorMsg.includes('array vazio') ||
        errorMsg.includes('lista vazia');
      
      if (isEmptyResultError) {
        console.warn('[TinyDashboard] Sem registros para sincronizar, mas a conexão está ok');
        setStats({ 
          totalClientes: 0, 
          totalPedidos: 0, 
          pedidosAbertos: 0,
          ultimaSincronizacao: new Date().toLocaleString('pt-BR')
        });
        setConnectionStatus('connected');
        setConnectionError(null);
      } else {
        // Em caso de outros erros, mostra a mensagem de erro e desconecta
        setLoadingSync(false);
        setConnectionStatus('disconnected');
        setConnectionError(errorMsg || 'Erro ao sincronizar com o Tiny');
      }
    } finally {
      setLoadingSync(false);
    }
  };

  // Função para extrair a contagem total de registros
  const extractTotalCount = (data: any[]): number => {
    if (!data || data.length === 0) return 0;
    
    // Para APIs que retornam a contagem total de registros
    const primeiroRegistro = data[0];
    if (primeiroRegistro && typeof primeiroRegistro === 'object') {
      // Tenta diversos campos possíveis onde pode estar o total
      if (primeiroRegistro.total_registros) {
        return parseInt(primeiroRegistro.total_registros, 10) || 0;
      }
      if (primeiroRegistro.totalRegistros) {
        return parseInt(primeiroRegistro.totalRegistros, 10) || 0;
      }
      if (primeiroRegistro.total) {
        return parseInt(primeiroRegistro.total, 10) || 0;
      }
    }
    
    // Se não encontrar o total em um campo específico, usa o tamanho do array
    return data.length;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Card de Status da Conexão */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Status da Integração</CardTitle>
          <CardDescription>
            Estado atual da conexão com o Tiny ERP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'connected' ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Conectado ao Tiny ERP</AlertTitle>
              <AlertDescription>
                A integração está funcionando corretamente com o token configurado.
              </AlertDescription>
            </Alert>
          ) : connectionStatus === 'checking' ? (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando conexão...</AlertTitle>
              <AlertDescription>
                Aguarde enquanto testamos a conexão com o Tiny ERP.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Desconectado do Tiny ERP</AlertTitle>
              <AlertDescription>
                {connectionError || 'Verifique suas configurações de API e tente novamente.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Token de API:</div>
              <div className="text-sm font-medium">
                {TINY_CONFIG.API_TOKEN ? 
                  `${TINY_CONFIG.API_TOKEN.substring(0, 8)}...${TINY_CONFIG.API_TOKEN.substring(TINY_CONFIG.API_TOKEN.length - 8)}` : 
                  'Não configurado'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">URL da API:</div>
              <div className="text-sm font-medium">{TINY_CONFIG.API_BASE_URL || tinyConfig.baseUrl}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Última sincronização:</div>
              <div className="text-sm font-medium">{stats.ultimaSincronizacao || 'Nunca'}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={checkConnection}
            disabled={connectionStatus === 'checking'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
            Testar Conexão
          </Button>
          
          <Button 
            onClick={handleSync}
            disabled={connectionStatus !== 'connected' || loadingSync}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingSync ? 'animate-spin' : ''}`} />
            {loadingSync ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Cards de Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Total de clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalClientes}</div>
        </CardContent>
        <CardFooter>
          <Badge variant="outline" className="w-full justify-center">
            {connectionStatus === 'connected' ? 'Dados atualizados' : 'Conexão necessária'}
          </Badge>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>Total de pedidos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalPedidos}</div>
          <div className="text-sm text-muted-foreground mt-2">
            {stats.pedidosAbertos} pedidos em aberto
          </div>
        </CardContent>
        <CardFooter>
          <Badge variant="outline" className="w-full justify-center">
            {connectionStatus === 'connected' ? 'Dados atualizados' : 'Conexão necessária'}
          </Badge>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TinyDashboard; 