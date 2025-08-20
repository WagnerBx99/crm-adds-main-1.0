import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { Pedido, StatusPedido } from '../../types/tiny';
import DetalheUnificado from './DetalheUnificado';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, RefreshCw, Search, X, ChevronUp, ChevronDown, Filter, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

type OrdenacaoField = 'numero' | 'data_pedido' | 'cliente' | 'valor_total' | 'situacao';
type OrdenacaoDir = 'asc' | 'desc';

interface FiltrosAvancados {
  busca: string;
  status: StatusPedido | 'todos';
  dataInicial: string;
  dataFinal: string;
}

/**
 * Componente para listar e gerenciar pedidos do Tiny com interface avançada
 */
const PedidosTiny: React.FC<{ onSync?: () => Promise<void> }> = ({ onSync }) => {
  const tinyService = useTinyService();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  
  // Estados de filtros e ordenação
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    busca: '',
    status: 'todos',
    dataInicial: '',
    dataFinal: ''
  });
  const [ordenacao, setOrdenacao] = useState<{ field: OrdenacaoField; direction: OrdenacaoDir }>({
    field: 'numero',
    direction: 'desc'
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Debounce para busca
  const [buscaDebounce, setBuscaDebounce] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros(prev => ({ ...prev, busca: buscaDebounce }));
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaDebounce]);
  
  // Função para carregar os pedidos
  const loadPedidos = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Carregando pedidos do Tiny...`);
      
      // Preparar filtros para API
      const filtrosAPI: any = { 
        registros_por_pagina: 500 // Aumentar significativamente para melhor experiência
      };
      
      // Adicionar filtro de status apenas se não for 'todos'
      if (filtros.status !== 'todos') {
        filtrosAPI.situacao = filtros.status;
      }
      
      // Adicionar filtros de data se preenchidos
      if (filtros.dataInicial) {
        filtrosAPI.data_inicial = new Date(filtros.dataInicial).toLocaleDateString('pt-BR');
      }
      if (filtros.dataFinal) {
        filtrosAPI.data_final = new Date(filtros.dataFinal).toLocaleDateString('pt-BR');
      }
      
      // Se há busca específica por número, usar na API
      if (filtros.busca.trim() && /^\d+$/.test(filtros.busca.trim())) {
        filtrosAPI.numero = filtros.busca.trim();
        console.log(`🔍 Buscando pedido específico por número: ${filtros.busca.trim()}`);
      }
      
      // IMPORTANTE: Usar forceRefresh para ignorar cache quando necessário
      const data = await tinyService.getPedidos(filtrosAPI, forceRefresh);
      
      console.log(`Recebidos ${data.length} pedidos da API Tiny`);
      
      // Validar dados antes de definir o estado
      if (Array.isArray(data)) {
        const pedidosValidos = data.filter(pedido => 
          pedido.id && 
          pedido.id !== '' && 
          pedido.numero && 
          pedido.numero !== '-'
        );
        
        setPedidos(pedidosValidos);
        
        if (pedidosValidos.length === 0 && data.length > 0) {
          console.warn('Todos os pedidos retornados são inválidos/vazios');
        }
      } else {
        setPedidos([]);
        setError('Formato de dados inválido retornado pela API');
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      
      if (err.message && (
        err.message.includes('não retornou registros') || 
        err.message.includes('Nenhum registro encontrado')
      )) {
        setPedidos([]);
      } else {
        setError(`Erro ao carregar pedidos: ${err.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filtros.status, filtros.dataInicial, filtros.dataFinal, filtros.busca, tinyService]);
  
  // Carregar pedidos quando filtros mudarem
  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);
  
  // Filtrar e ordenar pedidos
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];
    
    // Aplicar filtro de busca
    if (filtros.busca.trim()) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      resultado = resultado.filter(pedido => 
        pedido.numero.toLowerCase().includes(termoBusca) ||
        pedido.numero_ecommerce?.toLowerCase().includes(termoBusca) ||
        pedido.cliente?.nome?.toLowerCase().includes(termoBusca) ||
        pedido.situacao.toLowerCase().includes(termoBusca)
      );
    }
    
    // Aplicar ordenação
    resultado.sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (ordenacao.field) {
        case 'numero':
          valorA = parseInt(a.numero) || 0;
          valorB = parseInt(b.numero) || 0;
          break;
        case 'data_pedido':
          valorA = new Date(a.data_pedido.split('/').reverse().join('-')).getTime();
          valorB = new Date(b.data_pedido.split('/').reverse().join('-')).getTime();
          break;
        case 'cliente':
          valorA = a.cliente?.nome?.toLowerCase() || '';
          valorB = b.cliente?.nome?.toLowerCase() || '';
          break;
        case 'valor_total':
          valorA = a.valor_total || 0;
          valorB = b.valor_total || 0;
          break;
        case 'situacao':
          valorA = a.situacao.toLowerCase();
          valorB = b.situacao.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (valorA < valorB) return ordenacao.direction === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return resultado;
  }, [pedidos, filtros.busca, ordenacao]);
  
  // Função para alterar ordenação
  const handleOrdenacao = (field: OrdenacaoField) => {
    setOrdenacao(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Função para sincronizar dados
  const handleSync = async () => {
    try {
      if (onSync) {
        await onSync();
      }
      await loadPedidos(true);
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    }
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      status: 'todos',
      dataInicial: '',
      dataFinal: ''
    });
    setBuscaDebounce('');
  };
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtros.busca || filtros.status !== 'todos' || filtros.dataInicial || filtros.dataFinal;
  
  // Abre a tela de detalhes do pedido
  const handleVerDetalhes = (pedidoId: string) => {
    setPedidoSelecionado(pedidoId);
  };
  
  // Fecha a tela de detalhes
  const handleFecharDetalhes = () => {
    setPedidoSelecionado(null);
  };
  
  // Recarrega a lista após atualização
  const handlePedidoAtualizado = async () => {
    await loadPedidos(true);
  };
  
  // Formata status para exibição
  const formatarStatus = (status: string): string => {
    const formatoStatus: Record<string, string> = {
      [StatusPedido.PENDENTE]: 'Pendente',
      [StatusPedido.APROVADO]: 'Aprovado',
      [StatusPedido.EM_PRODUCAO]: 'Em Produção',
      [StatusPedido.PRONTO_PARA_ENVIO]: 'Pronto para Envio',
      [StatusPedido.ENVIADO]: 'Enviado',
      [StatusPedido.ENTREGUE]: 'Entregue',
      [StatusPedido.FINALIZADO]: 'Finalizado',
      [StatusPedido.CANCELADO]: 'Cancelado'
    };
    
    return formatoStatus[status] || status;
  };
  
  // Retorna a classe CSS para o status
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      [StatusPedido.PENDENTE]: 'outline',
      [StatusPedido.APROVADO]: 'secondary',
      [StatusPedido.EM_PRODUCAO]: 'default',
      [StatusPedido.PRONTO_PARA_ENVIO]: 'default',
      [StatusPedido.ENVIADO]: 'default',
      [StatusPedido.ENTREGUE]: 'secondary',
      [StatusPedido.FINALIZADO]: 'secondary',
      [StatusPedido.CANCELADO]: 'destructive'
    };
    
    return variants[status] || 'outline';
  };
  
  // Formata valor monetário
  const formatarValor = (valor?: number|null): string => {
    if (valor == null || !Number.isFinite(valor)) {
      return 'R$ 0,00';
    }
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };
  
  // Ícone de ordenação
  const IconeOrdenacao = ({ field }: { field: OrdenacaoField }) => {
    if (ordenacao.field !== field) {
      return <div className="w-4 h-4" />;
    }
    return ordenacao.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };
  
  // Se um pedido estiver selecionado, exibe os detalhes unificados
  if (pedidoSelecionado) {
    return (
      <DetalheUnificado
        pedidoId={pedidoSelecionado}
        origem="pedidos"
        onVoltar={handleFecharDetalhes}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header com título e ações principais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            {pedidosFiltrados.length} de {pedidos.length} pedidos
            {temFiltrosAtivos && ' (filtrados)'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={temFiltrosAtivos ? 'border-primary text-primary' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {temFiltrosAtivos && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {[filtros.busca, filtros.status !== 'todos', filtros.dataInicial, filtros.dataFinal].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          <Button 
            onClick={handleSync} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>
      
      {/* Barra de busca principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por número, cliente, e-commerce..."
          value={buscaDebounce}
          onChange={(e) => setBuscaDebounce(e.target.value)}
          className="pl-10 pr-10"
        />
        {buscaDebounce && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBuscaDebounce('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Filtros avançados */}
      {mostrarFiltros && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filtros.status} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value as StatusPedido | 'todos' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value={StatusPedido.PENDENTE}>Pendente</SelectItem>
                    <SelectItem value={StatusPedido.APROVADO}>Aprovado</SelectItem>
                    <SelectItem value={StatusPedido.EM_PRODUCAO}>Em Produção</SelectItem>
                    <SelectItem value={StatusPedido.PRONTO_PARA_ENVIO}>Pronto para Envio</SelectItem>
                    <SelectItem value={StatusPedido.ENVIADO}>Enviado</SelectItem>
                    <SelectItem value={StatusPedido.ENTREGUE}>Entregue</SelectItem>
                    <SelectItem value={StatusPedido.FINALIZADO}>Finalizado</SelectItem>
                    <SelectItem value={StatusPedido.CANCELADO}>Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="date"
                    value={filtros.dataInicial}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataInicial: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data Final</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="date"
                    value={filtros.dataFinal}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataFinal: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  disabled={!temFiltrosAtivos}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Alertas de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('numero')}
                  >
                    <div className="flex items-center gap-2">
                      Número
                      <IconeOrdenacao field="numero" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('data_pedido')}
                  >
                    <div className="flex items-center gap-2">
                      Data
                      <IconeOrdenacao field="data_pedido" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('cliente')}
                  >
                    <div className="flex items-center gap-2">
                      Cliente
                      <IconeOrdenacao field="cliente" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('valor_total')}
                  >
                    <div className="flex items-center gap-2">
                      Valor
                      <IconeOrdenacao field="valor_total" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('situacao')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <IconeOrdenacao field="situacao" />
                    </div>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Carregando pedidos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pedidosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <Search className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">Nenhum pedido encontrado</p>
                          <p className="text-sm">
                            {temFiltrosAtivos 
                              ? 'Tente ajustar os filtros ou limpar a busca' 
                              : 'Não há pedidos cadastrados no período'}
                          </p>
                        </div>
                        {temFiltrosAtivos && (
                          <Button variant="outline" size="sm" onClick={limparFiltros}>
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <TableRow 
                      key={pedido.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleVerDetalhes(pedido.id)}
                    >
                      <TableCell>
                        <div>
                          <span className="font-medium">#{pedido.numero}</span>
                          {pedido.numero_ecommerce && (
                            <div className="text-xs text-muted-foreground">
                              E-comm: {pedido.numero_ecommerce}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(pedido.data_pedido) || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">
                            {pedido.cliente?.nome || '-'}
                          </div>
                          {pedido.cliente?.cpf_cnpj && (
                            <div className="text-xs text-muted-foreground">
                              {pedido.cliente.cpf_cnpj}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatarValor(pedido.valor_total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(pedido.situacao)}>
                          {formatarStatus(pedido.situacao)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerDetalhes(pedido.id);
                          }}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PedidosTiny; 