import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTinyService } from '../../lib/integrations/tiny/tinyServiceFactory';
import { Cliente, NotaFiscal } from '../../types/tiny';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, RefreshCw, Search, X, ChevronUp, ChevronDown, Filter, User, Building, Loader2, FileText } from 'lucide-react';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import DetalheUnificado from './DetalheUnificado';
import './tinyStyles.css';

type OrdenacaoField = 'nome' | 'cpf_cnpj' | 'email' | 'data_cadastro' | 'situacao';
type OrdenacaoDir = 'asc' | 'desc';

interface FiltrosAvancados {
  busca: string;
  tipo: 'todos' | 'F' | 'J';
  situacao: 'todos' | 'A' | 'I';
}

/**
 * Componente para listar e gerenciar clientes do Tiny com interface avançada
 */
const ClientesTiny: React.FC<{ onSync?: () => Promise<void> }> = ({ onSync }) => {
  const tinyService = useTinyService();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buscandoMais, setBuscandoMais] = useState(false);
  
  // Estados de filtros e ordenação
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    busca: '',
    tipo: 'todos',
    situacao: 'todos'
  });
  const [ordenacao, setOrdenacao] = useState<{ field: OrdenacaoField; direction: OrdenacaoDir }>({
    field: 'nome',
    direction: 'asc'
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estado para controle de busca
  const [termoBusca, setTermoBusca] = useState('');
  const [paginasCarregadas, setPaginasCarregadas] = useState(0);
  const [ultimaPaginaCarregada, setUltimaPaginaCarregada] = useState(false);
  
  // Estados para navegação com DetalheUnificado
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Debounce para busca - SIMPLIFICADO
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros(prev => ({ ...prev, busca: termoBusca }));
    }, 300);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  // Função para carregar os clientes - CORRIGIDA PARA EVITAR LOOPS
  const loadClientes = useCallback(async (forceRefresh = false, apenasNovasPaginas = false) => {
    if (!apenasNovasPaginas) {
      setLoading(true);
    } else {
      setBuscandoMais(true);
    }
    setError(null);

    try {
      console.log('Carregando clientes do Tiny...');
      
      let todosClientes: any[] = apenasNovasPaginas ? [...clientes] : [];
      const paginaInicial = apenasNovasPaginas ? paginasCarregadas + 1 : 1;
      const maxPaginas = apenasNovasPaginas ? Math.min(5, 20 - paginasCarregadas) : 5; // Máximo 5 páginas por vez
      
      let paginasProcessadas = 0;
      
      for (let i = 0; i < maxPaginas; i++) {
        const pagina = paginaInicial + i;
        
        try {
          const filtrosAPI: any = {
            registros_por_pagina: 100,
            pagina: pagina
          };

          // Só aplicar filtros estáticos (não de busca) na API
          if (filtros.situacao !== 'todos') {
            filtrosAPI.situacao = filtros.situacao;
          }

          const clientesPagina = await tinyService.getClientes(filtrosAPI, forceRefresh);
          
          if (clientesPagina.length === 0) {
            console.log(`📄 Página ${pagina} vazia, parando busca`);
            setUltimaPaginaCarregada(true);
            break;
          }
          
          todosClientes = [...todosClientes, ...clientesPagina];
          paginasProcessadas++;
          console.log(`📄 Página ${pagina}: ${clientesPagina.length} clientes (total: ${todosClientes.length})`);
          
          // Se retornou menos que 100, provavelmente é a última página
          if (clientesPagina.length < 100) {
            console.log(`✅ Última página encontrada (${clientesPagina.length} < 100)`);
            setUltimaPaginaCarregada(true);
            break;
          }
        } catch (error) {
          console.warn(`❌ Erro na página ${pagina}:`, error);
          break;
        }
      }

      // Remover duplicados baseado no ID
      const clientesUnicos = todosClientes.filter((cliente, index, array) => 
        array.findIndex(c => c.id === cliente.id) === index
      );
      
      setClientes(clientesUnicos);
      setPaginasCarregadas(paginaInicial + paginasProcessadas - 1);
      console.log(`✅ Total de ${clientesUnicos.length} clientes únicos carregados (${paginasProcessadas} páginas processadas)`);
      
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setBuscandoMais(false);
    }
  }, [tinyService, filtros.situacao, clientes, paginasCarregadas]); // REMOVIDO filtros.busca das dependências

  // Carregar dados iniciais - APENAS UMA VEZ
  useEffect(() => {
    loadClientes();
  }, []); // SEM DEPENDÊNCIAS para evitar loops

  // Recarregar quando filtros não-busca mudarem
  useEffect(() => {
    if (filtros.situacao !== 'todos') {
      setClientes([]);
      setPaginasCarregadas(0);
      setUltimaPaginaCarregada(false);
      loadClientes(true);
    }
  }, [filtros.situacao]); // APENAS filtros.situacao

  // Função para carregar mais dados quando necessário
  const carregarMaisDados = useCallback(async () => {
    if (ultimaPaginaCarregada || buscandoMais || loading) return;
    await loadClientes(false, true);
  }, [ultimaPaginaCarregada, buscandoMais, loading, loadClientes]);

  // Função para visualizar detalhes do cliente
  const visualizarDetalhesCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setMostrarDetalhes(true);
  };

  // Função para voltar à lista de clientes
  const voltarParaClientes = () => {
    setMostrarDetalhes(false);
    setClienteSelecionado(null);
  };

  // Filtrar e ordenar clientes - OTIMIZADO
  const clientesFiltrados = useMemo(() => {
    let resultado = [...clientes];

    // Aplicar filtro de busca - CLIENTE SIDE APENAS
    if (filtros.busca.trim()) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      resultado = resultado.filter(cliente => 
        cliente.nome?.toLowerCase().includes(termoBusca) ||
        cliente.cpf_cnpj?.toLowerCase().includes(termoBusca) ||
        cliente.email?.toLowerCase().includes(termoBusca) ||
        cliente.fone?.toLowerCase().includes(termoBusca) ||
        cliente.celular?.toLowerCase().includes(termoBusca)
      );
      
      // Se poucos resultados e ainda há páginas para carregar, sugerir carregar mais
      if (resultado.length < 10 && !ultimaPaginaCarregada && !buscandoMais) {
        // Não carregar automaticamente para evitar loops
        console.log('💡 Poucos resultados encontrados, usuário pode carregar mais dados manualmente');
      }
    }

    // Aplicar filtro de tipo
    if (filtros.tipo !== 'todos') {
      resultado = resultado.filter(cliente => cliente.tipo === filtros.tipo);
    }

    // A situação já é filtrada na API, não precisa filtrar aqui novamente

    // Aplicar ordenação
    resultado.sort((a, b) => {
      const aValue = a[ordenacao.field] || '';
      const bValue = b[ordenacao.field] || '';
      
      if (ordenacao.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return resultado;
  }, [clientes, filtros, ordenacao, ultimaPaginaCarregada, buscandoMais]);

  // Função para alterar ordenação
  const handleOrdenacao = (field: OrdenacaoField) => {
    setOrdenacao(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Função para sincronizar dados - MELHORADA
  const handleSync = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Sincronizando dados...');
      
      // Limpar cache e estado
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tiny_cache_clientes_') || key.startsWith('tiny_cache_cliente_')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removido cache: ${key}`);
        }
      });

      // Reset estados
      setClientes([]);
      setPaginasCarregadas(0);
      setUltimaPaginaCarregada(false);

      if (onSync) {
        await onSync();
      }
      
      // Recarregar com dados frescos
      await loadClientes(true);
      
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      setError(error instanceof Error ? error.message : 'Erro na sincronização');
    }
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      tipo: 'todos',
      situacao: 'todos'
    });
    setTermoBusca('');
  };

  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtros.busca || filtros.tipo !== 'todos' || filtros.situacao !== 'todos';

  // Formatar CPF/CNPJ
  const formatarCpfCnpj = (cpfCnpj: string): string => {
    if (!cpfCnpj) return '-';
    
    const numbers = cpfCnpj.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      // CPF
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      // CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cpfCnpj;
  };

  // Formatar telefone
  const formatarTelefone = (telefone: string): string => {
    if (!telefone) return '-';
    
    const numbers = telefone.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  };

  // Formatar data
  const formatarData = (data: string): string => {
    if (!data) return '-';
    
    // Se já está no formato brasileiro (dd/mm/yyyy)
    if (data.includes('/')) {
      return data;
    }
    
    // Se está no formato ISO (yyyy-mm-dd)
    if (data.includes('-')) {
      const [year, month, day] = data.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return data;
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

  // Se está mostrando detalhes, renderizar o componente unificado
  if (mostrarDetalhes && clienteSelecionado) {
    return (
      <DetalheUnificado
        clienteData={{
          id: clienteSelecionado.id,
          nome: clienteSelecionado.nome,
          cpf_cnpj: clienteSelecionado.cpf_cnpj
        }}
        origem="clientes"
        onVoltar={voltarParaClientes}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com título e ações principais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500">
            {clientesFiltrados.length} de {clientes.length} clientes
            {filtros.busca.trim() || filtros.tipo !== 'todos' || filtros.situacao !== 'todos' ? ' (filtrados)' : ''}
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
                {[filtros.busca, filtros.tipo !== 'todos', filtros.situacao !== 'todos'].filter(Boolean).length}
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
          placeholder="Buscar por nome, CPF/CNPJ, email, telefone..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="pl-10 pr-10"
        />
        {termoBusca && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTermoBusca('')}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={filtros.tipo} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value as 'todos' | 'F' | 'J' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="F">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Pessoa Física
                      </div>
                    </SelectItem>
                    <SelectItem value="J">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Pessoa Jurídica
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Situação</Label>
                <Select 
                  value={filtros.situacao} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, situacao: value as 'todos' | 'A' | 'I' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as situações</SelectItem>
                    <SelectItem value="A">Ativo</SelectItem>
                    <SelectItem value="I">Inativo</SelectItem>
                  </SelectContent>
                </Select>
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
      
      {/* Tabela de clientes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('nome')}
                  >
                    <div className="flex items-center gap-2">
                      Nome
                      <IconeOrdenacao field="nome" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('cpf_cnpj')}
                  >
                    <div className="flex items-center gap-2">
                      CPF/CNPJ
                      <IconeOrdenacao field="cpf_cnpj" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('email')}
                  >
                    <div className="flex items-center gap-2">
                      E-mail
                      <IconeOrdenacao field="email" />
                    </div>
                  </TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleOrdenacao('data_cadastro')}
                  >
                    <div className="flex items-center gap-2">
                      Data de Cadastro
                      <IconeOrdenacao field="data_cadastro" />
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
                        <span>Carregando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32">
                      <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                        <Search className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">Nenhum cliente encontrado</p>
                          <p className="text-sm">
                            {filtros.busca.trim() 
                              ? `Nenhum cliente corresponde à busca "${filtros.busca}"`
                              : temFiltrosAtivos
                                ? 'Nenhum cliente corresponde aos filtros selecionados.'
                                : 'Nenhum cliente encontrado.'
                            }
                          </p>
                          {filtros.busca.trim() && !ultimaPaginaCarregada && (
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={carregarMaisDados}
                                disabled={buscandoMais}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                {buscandoMais ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Carregando mais dados...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Carregar mais dados
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">
                                Já carregamos {clientes.length} clientes. Clique para buscar mais.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <TableRow 
                      key={cliente.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => visualizarDetalhesCliente(cliente)}
                    >
                      <TableCell>
                        <div className="max-w-[250px]">
                          <div className="font-medium truncate">
                            {cliente.nome}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {cliente.tipo === 'F' ? (
                              <>
                                <User className="w-3 h-3" />
                                Pessoa Física
                              </>
                            ) : (
                              <>
                                <Building className="w-3 h-3" />
                                Pessoa Jurídica
                              </>
                            )}
                            {cliente.situacao === 'A' ? (
                              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">Ativo</Badge>
                            ) : cliente.situacao === 'I' ? (
                              <Badge variant="destructive" className="ml-1">Inativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">Ativo</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatarCpfCnpj(cliente.cpf_cnpj)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {cliente.email || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatarTelefone(cliente.fone || cliente.celular)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatarData(cliente.data_cadastro)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Indicador para carregar mais dados quando há poucos resultados */}
          {!loading && clientesFiltrados.length > 0 && clientesFiltrados.length < 10 && 
           filtros.busca.trim() && !ultimaPaginaCarregada && (
            <div className="p-4 border-t bg-blue-50/50 text-center">
              <p className="text-sm text-blue-700 mb-2">
                Encontrados apenas {clientesFiltrados.length} resultados para "{filtros.busca}"
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={carregarMaisDados}
                disabled={buscandoMais}
                className="text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                {buscandoMais ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Carregando mais dados...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Carregar mais dados
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Dados carregados: {clientes.length} clientes de {paginasCarregadas} páginas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientesTiny; 