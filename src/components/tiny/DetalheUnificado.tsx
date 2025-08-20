import React, { useState, useEffect } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { PedidoDetalhado, NotaFiscal } from '../../types/tiny';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Truck, 
  CreditCard,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

interface DetalheUnificadoProps {
  pedidoId?: string;
  notaFiscalId?: string;
  clienteData?: { id: string; nome: string; cpf_cnpj: string; }; // Dados do cliente quando vier de clientes
  origem: 'clientes' | 'pedidos';
  onVoltar: () => void;
}

/**
 * Componente unificado para exibir detalhes de pedidos e notas fiscais
 */
const DetalheUnificado: React.FC<DetalheUnificadoProps> = ({
  pedidoId,
  notaFiscalId,
  clienteData,
  origem,
  onVoltar
}) => {
  const tinyService = useTinyService();
  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [notaFiscalSelecionada, setNotaFiscalSelecionada] = useState<NotaFiscal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chaveCopiada, setChaveCopiada] = useState(false);

  // Carregar dados do pedido e notas fiscais
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError(null);

      try {
        let pedidoCarregado: PedidoDetalhado | null = null;
        let notasCarregadas: NotaFiscal[] = [];

        // Se veio com pedidoId, carregar o pedido
        if (pedidoId) {
          console.log(`🔍 Carregando detalhes do pedido: ${pedidoId}`);
          pedidoCarregado = await tinyService.getPedidoById(pedidoId);
          setPedido(pedidoCarregado);

          // Buscar notas fiscais relacionadas ao pedido (por cliente)
          if (pedidoCarregado?.cpf_cnpj_cliente) {
            console.log(`🔍 Carregando notas fiscais do cliente: ${pedidoCarregado.cpf_cnpj_cliente}`);
            notasCarregadas = await tinyService.getNotasFiscaisPorCliente(pedidoCarregado.cpf_cnpj_cliente);
            
            // Filtrar notas que podem estar relacionadas ao pedido (mesmo período ou valor similar)
            const datasPedido = new Date(pedidoCarregado.data_pedido.split('/').reverse().join('-'));
            const notasRelacionadas = notasCarregadas.filter(nf => {
              // Considerar notas do mesmo mês/ano
              const dataNF = new Date(nf.data_emissao.split('/').reverse().join('-'));
              const mesmoMes = dataNF.getMonth() === datasPedido.getMonth() && 
                             dataNF.getFullYear() === datasPedido.getFullYear();
              
              // Ou valores similares (diferença de até 10%)
              const valorPedido = pedidoCarregado.valor_total;
              const valorNF = nf.valor;
              const diferencaPercentual = Math.abs(valorPedido - valorNF) / valorPedido;
              const valorSimilar = diferencaPercentual <= 0.1;

              return mesmoMes || valorSimilar;
            });
            
            setNotasFiscais(notasRelacionadas);
          }
        }

        // Se veio de clientes com dados do cliente, buscar pedidos e notas fiscais
        if (clienteData && origem === 'clientes') {
          console.log(`🔍 Carregando dados do cliente: ${clienteData.nome} (${clienteData.cpf_cnpj})`);
          
          try {
            // Buscar pedidos do cliente por CPF/CNPJ (se tiver)
            if (clienteData.cpf_cnpj) {
              console.log(`🔍 Buscando pedidos do cliente por CPF/CNPJ: ${clienteData.cpf_cnpj}`);
              
              // Primeiro, buscar todos os pedidos e filtrar pelo CPF/CNPJ do cliente
              const todosPedidos = await tinyService.getPedidos({ registros_por_pagina: 500 });
              const pedidosDoCliente = todosPedidos.filter(p => 
                p.cliente?.cpf_cnpj === clienteData.cpf_cnpj ||
                p.cliente?.nome?.toLowerCase().includes(clienteData.nome.toLowerCase())
              );
              
              console.log(`📋 Encontrados ${pedidosDoCliente.length} pedidos para o cliente`);
              
              // Se encontrou pedidos, usar o primeiro como pedido principal (mais recente)
              if (pedidosDoCliente.length > 0) {
                const pedidoMaisRecente = pedidosDoCliente.sort((a, b) => {
                  const dataA = new Date(a.data_pedido.split('/').reverse().join('-'));
                  const dataB = new Date(b.data_pedido.split('/').reverse().join('-'));
                  return dataB.getTime() - dataA.getTime();
                })[0];
                
                // Carregar detalhes do pedido mais recente
                const pedidoDetalhado = await tinyService.getPedidoById(pedidoMaisRecente.id);
                setPedido(pedidoDetalhado);
                pedidoCarregado = pedidoDetalhado;
              }
              
              // Buscar notas fiscais do cliente
              console.log(`🔍 Buscando notas fiscais do cliente: ${clienteData.cpf_cnpj}`);
              notasCarregadas = await tinyService.getNotasFiscaisPorCliente(clienteData.cpf_cnpj);
              console.log(`📋 Encontradas ${notasCarregadas.length} notas fiscais para o cliente`);
              
              setNotasFiscais(notasCarregadas);
            } else {
              console.warn('Cliente sem CPF/CNPJ, buscando apenas por nome');
              // Buscar por nome se não tiver CPF/CNPJ
              const todosPedidos = await tinyService.getPedidos({ registros_por_pagina: 500 });
              const pedidosDoCliente = todosPedidos.filter(p => 
                p.cliente?.nome?.toLowerCase().includes(clienteData.nome.toLowerCase())
              );
              
              if (pedidosDoCliente.length > 0) {
                const pedidoMaisRecente = pedidosDoCliente.sort((a, b) => {
                  const dataA = new Date(a.data_pedido.split('/').reverse().join('-'));
                  const dataB = new Date(b.data_pedido.split('/').reverse().join('-'));
                  return dataB.getTime() - dataA.getTime();
                })[0];
                
                const pedidoDetalhado = await tinyService.getPedidoById(pedidoMaisRecente.id);
                setPedido(pedidoDetalhado);
              }
              
              // Tentar buscar notas fiscais por nome
              const todasNotas = await tinyService.getNotasFiscais();
              const notasDoCliente = todasNotas.filter(nf => 
                nf.cliente_nome?.toLowerCase().includes(clienteData.nome.toLowerCase())
              );
              setNotasFiscais(notasDoCliente);
            }
          } catch (error) {
            console.error('Erro ao buscar dados do cliente:', error);
            // Não falhar completamente, apenas log do erro
          }
        }

        // Se veio com notaFiscalId específica (caso de busca direta por nota)
        if (notaFiscalId && !clienteData && !pedidoCarregado) {
          console.log(`🔍 Carregando nota fiscal específica: ${notaFiscalId}`);
          try {
            const todasNotas = await tinyService.getNotasFiscais();
            const notaEspecifica = todasNotas.find(nf => nf.id === notaFiscalId);
            
            if (notaEspecifica) {
              setNotaFiscalSelecionada(notaEspecifica);
              setNotasFiscais([notaEspecifica]);
            }
          } catch (error) {
            console.error('Erro ao buscar nota fiscal específica:', error);
            setNotasFiscais([]);
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [pedidoId, notaFiscalId, clienteData, origem, tinyService]);

  // Formatar valores monetários
  const formatarValor = (valor: number): string => {
    if (!valor || valor === 0) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar CPF/CNPJ
  const formatarCpfCnpj = (cpfCnpj: string): string => {
    if (!cpfCnpj) return '-';
    
    const numbers = cpfCnpj.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cpfCnpj;
  };

  // Formatar data
  const formatarData = (data: string): string => {
    if (!data) return '-';
    
    if (data.includes('/')) {
      return data;
    }
    
    if (data.includes('-')) {
      const [year, month, day] = data.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return data;
  };

  // Formatar situação da nota fiscal
  const formatarSituacaoNF = (situacao: number, descricao?: string): { 
    label: string; 
    variant: 'default' | 'secondary' | 'destructive' | 'outline' 
  } => {
    if (descricao) {
      return { label: descricao, variant: 'secondary' };
    }
    
    switch (situacao) {
      case 1:
        return { label: 'Autorizada', variant: 'secondary' };
      case 2:
        return { label: 'Cancelada', variant: 'destructive' };
      case 3:
        return { label: 'Inutilizada', variant: 'outline' };
      default:
        return { label: `Situação ${situacao}`, variant: 'default' };
    }
  };

  // Copiar chave de acesso
  const copiarChave = async (chave: string) => {
    try {
      await navigator.clipboard.writeText(chave);
      setChaveCopiada(true);
      setTimeout(() => setChaveCopiada(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar chave:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para {origem === 'clientes' ? 'Clientes' : 'Pedidos'}
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {pedido ? `Detalhes do Pedido #${pedido.numero}` : 'Detalhes da Nota Fiscal'}
          </h2>
          <p className="text-sm text-gray-500">
            {pedido ? pedido.nome_cliente : notaFiscalSelecionada?.cliente_nome}
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <Tabs defaultValue="pedido" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pedido" disabled={!pedido}>
            <Package className="w-4 h-4 mr-2" />
            Pedido
          </TabsTrigger>
          <TabsTrigger value="notas">
            <FileText className="w-4 h-4 mr-2" />
            Notas Fiscais ({notasFiscais.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba do Pedido */}
        {pedido && (
          <TabsContent value="pedido" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Número</Label>
                      <p className="text-lg font-semibold">{pedido.numero}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <Badge variant="secondary">{pedido.situacao}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data do Pedido</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatarData(pedido.data_pedido)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Última Atualização</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatarData(pedido.ultima_atualizacao)}
                      </p>
                    </div>
                  </div>

                  {pedido.numero_ecommerce && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Número E-commerce</Label>
                      <p className="text-lg font-semibold">{pedido.numero_ecommerce}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Forma de Pagamento</Label>
                      <p className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {pedido.forma_pagamento || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Forma de Frete</Label>
                      <p className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {pedido.forma_frete || '-'}
                      </p>
                    </div>
                  </div>

                  {pedido.observacoes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Observações</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">{pedido.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Valores do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Valores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-500">Valor dos Produtos</Label>
                      <span className="text-lg font-semibold">{formatarValor(pedido.valor_produtos)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-500">Valor do Frete</Label>
                      <span className="text-lg font-semibold">{formatarValor(pedido.valor_frete)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-500">Desconto</Label>
                      <span className="text-lg font-semibold text-red-600">-{formatarValor(pedido.valor_desconto)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-medium text-gray-900">Valor Total</Label>
                      <span className="text-xl font-bold text-green-600">{formatarValor(pedido.valor_total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome</Label>
                    <p className="font-semibold">{pedido.nome_cliente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CPF/CNPJ</Label>
                    <p className="font-mono">{formatarCpfCnpj(pedido.cpf_cnpj_cliente)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Itens do Pedido ({pedido.itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Unitário</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedido.itens.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="font-mono">{item.codigo}</TableCell>
                          <TableCell>
                            <div className="max-w-[300px]">
                              <p className="font-medium">{item.descricao}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">{formatarValor(item.valor_unitario)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatarValor(item.valor_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba das Notas Fiscais */}
        <TabsContent value="notas" className="space-y-6">
          {notaFiscalSelecionada ? (
            /* Detalhes da Nota Fiscal Selecionada */
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setNotaFiscalSelecionada(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Lista de Notas
                </Button>
                <div>
                  <h3 className="text-xl font-bold">Nota Fiscal #{notaFiscalSelecionada.numero}</h3>
                  <p className="text-sm text-gray-500">Série {notaFiscalSelecionada.serie}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações da Nota Fiscal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Informações da Nota Fiscal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Número</Label>
                        <p className="text-lg font-semibold">{notaFiscalSelecionada.numero}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Série</Label>
                        <p className="text-lg font-semibold">{notaFiscalSelecionada.serie || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                        <Badge variant={notaFiscalSelecionada.tipo === 'S' ? 'default' : 'secondary'}>
                          {notaFiscalSelecionada.tipo === 'S' ? 'Saída (Venda)' : 'Entrada (Compra)'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Situação</Label>
                        <Badge variant={formatarSituacaoNF(notaFiscalSelecionada.situacao, notaFiscalSelecionada.descricao_situacao).variant}>
                          {formatarSituacaoNF(notaFiscalSelecionada.situacao, notaFiscalSelecionada.descricao_situacao).label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatarData(notaFiscalSelecionada.data_emissao)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Data de Saída/Entrada</Label>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatarData(notaFiscalSelecionada.data_saida_entrada)}
                        </p>
                      </div>
                    </div>

                    {notaFiscalSelecionada.numero_ecommerce && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Número do Pedido E-commerce</Label>
                        <p className="text-lg font-semibold">{notaFiscalSelecionada.numero_ecommerce}</p>
                      </div>
                    )}

                    {notaFiscalSelecionada.chave_acesso && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Chave de Acesso</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono break-all flex-1">{notaFiscalSelecionada.chave_acesso}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarChave(notaFiscalSelecionada.chave_acesso!)}
                            className="shrink-0"
                          >
                            {chaveCopiada ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Valores da Nota Fiscal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Valores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-gray-500">Valor dos Produtos</Label>
                        <span className="text-lg font-semibold">{formatarValor(notaFiscalSelecionada.valor_produtos)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-gray-500">Valor do Frete</Label>
                        <span className="text-lg font-semibold">{formatarValor(notaFiscalSelecionada.valor_frete)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-medium text-gray-900">Valor Total</Label>
                        <span className="text-xl font-bold text-green-600">{formatarValor(notaFiscalSelecionada.valor)}</span>
                      </div>
                    </div>

                    {(notaFiscalSelecionada.codigo_rastreamento || notaFiscalSelecionada.url_rastreamento) && (
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium text-gray-500">Rastreamento</Label>
                        {notaFiscalSelecionada.codigo_rastreamento && (
                          <p className="text-sm font-mono">{notaFiscalSelecionada.codigo_rastreamento}</p>
                        )}
                        {notaFiscalSelecionada.url_rastreamento && (
                          <a 
                            href={notaFiscalSelecionada.url_rastreamento} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Rastrear Pedido
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Lista de Notas Fiscais */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas Fiscais Relacionadas ({notasFiscais.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {notasFiscais.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhuma nota fiscal encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número NF</TableHead>
                          <TableHead>Número Pedido</TableHead>
                          <TableHead>Data Emissão</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Situação</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notasFiscais.map((notaFiscal) => (
                          <TableRow 
                            key={notaFiscal.id} 
                            className="hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setNotaFiscalSelecionada(notaFiscal)}
                          >
                            <TableCell>
                              <div className="font-medium">
                                NF {notaFiscal.numero}
                                {notaFiscal.serie && <span className="text-gray-500"> - Série {notaFiscal.serie}</span>}
                              </div>
                              <div className="text-xs text-gray-500">
                                {notaFiscal.tipo === 'S' ? 'Saída (Venda)' : 'Entrada (Compra)'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {notaFiscal.numero_ecommerce || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatarData(notaFiscal.data_emissao)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                  {formatarValor(notaFiscal.valor)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={formatarSituacaoNF(notaFiscal.situacao, notaFiscal.descricao_situacao).variant}>
                                {formatarSituacaoNF(notaFiscal.situacao, notaFiscal.descricao_situacao).label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetalheUnificado; 