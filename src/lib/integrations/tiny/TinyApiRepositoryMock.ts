import { 
  Cliente, 
  ClienteDTO, 
  Endereco, 
  FiltroCliente,
  FiltroPedido, 
  ItemPedido, 
  Pedido, 
  StatusPedido,
  Produto
} from '../../../types/tiny';
import { CacheService } from './CacheService';

/**
 * Repositório mock para API do Tiny durante desenvolvimento
 * Utiliza dados em memória e LocalStorage para simular a API
 */
export class TinyApiRepositoryMock {
  private mockClientes: Cliente[] = [];
  private mockPedidos: Pedido[] = [];
  private mockProdutos: Produto[] = [];
  
  constructor() {
    this.carregarDadosMock();
  }
  
  /**
   * Carrega dados mock do localStorage ou cria novos se não existirem
   */
  private carregarDadosMock(): void {
    // Tenta recuperar dados do cache
    const clientes = CacheService.getItem<Cliente[]>('mock_clientes');
    const pedidos = CacheService.getItem<Pedido[]>('mock_pedidos');
    const produtos = CacheService.getItem<Produto[]>('mock_produtos');
    
    if (clientes) {
      this.mockClientes = clientes;
    } else {
      // Cria dados mock iniciais
      this.mockClientes = this.gerarClientesMock();
      CacheService.setItem('mock_clientes', this.mockClientes);
    }
    
    if (pedidos) {
      this.mockPedidos = pedidos;
    } else {
      // Cria dados mock iniciais
      this.mockPedidos = this.gerarPedidosMock(this.mockClientes);
      CacheService.setItem('mock_pedidos', this.mockPedidos);
    }
    
    if (produtos) {
      this.mockProdutos = produtos;
    } else {
      // Cria dados mock iniciais
      this.mockProdutos = this.gerarProdutosMock();
      CacheService.setItem('mock_produtos', this.mockProdutos);
    }
    
    console.info('[TinyMock] Dados mock carregados:', {
      clientes: this.mockClientes.length,
      pedidos: this.mockPedidos.length,
      produtos: this.mockProdutos.length
    });
  }
  
  /**
   * Gera clientes fictícios para desenvolvimento
   * @returns Lista de clientes mock
   */
  private gerarClientesMock(): Cliente[] {
    const enderecos: Endereco[] = [
      {
        logradouro: 'Av. Paulista',
        numero: '1000',
        complemento: 'Sala 123',
        bairro: 'Bela Vista',
        cep: '01310-100',
        cidade: 'São Paulo',
        uf: 'SP'
      },
      {
        logradouro: 'Rua da Consolação',
        numero: '2500',
        bairro: 'Consolação',
        cep: '01301-100',
        cidade: 'São Paulo',
        uf: 'SP'
      },
      {
        logradouro: 'Av. Rio Branco',
        numero: '156',
        complemento: 'Andar 20',
        bairro: 'Centro',
        cep: '20040-901',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      },
      {
        logradouro: 'Av. Getúlio Vargas',
        numero: '1500',
        bairro: 'Funcionários',
        cep: '30112-021',
        cidade: 'Belo Horizonte',
        uf: 'MG'
      },
      {
        logradouro: 'Av. Sete de Setembro',
        numero: '1000',
        bairro: 'Centro',
        cep: '80230-000',
        cidade: 'Curitiba',
        uf: 'PR'
      }
    ];
    
    const nomes = [
      'Maria Silva Comercial Ltda',
      'João Pereira & Cia',
      'Ana Paula Distribuidora',
      'Carlos Oliveira S.A.',
      'Luiz Souza ME',
      'Roberto Almeida EPP',
      'Fernanda Santos Importadora',
      'Ricardo Mendes Comércio',
      'Patricia Lima Atacado',
      'Paulo Costa Representações'
    ];
    
    return Array.from({ length: 10 }, (_, i) => {
      const tipo = i % 3 === 0 ? 'F' : 'J';
      const cpfCnpj = tipo === 'F' 
        ? `${Math.floor(100000000 + Math.random() * 900000000)}00` // CPF fictício
        : `${Math.floor(10000000 + Math.random() * 90000000)}0001${Math.floor(10 + Math.random() * 90)}`; // CNPJ fictício
      
      const dataCadastro = new Date();
      dataCadastro.setMonth(dataCadastro.getMonth() - Math.floor(Math.random() * 24));
      
      const dataAlteracao = new Date(dataCadastro);
      dataAlteracao.setDate(dataAlteracao.getDate() + Math.floor(Math.random() * 30));
      
      return {
        id: `${i + 1}`,
        codigo: `CLI${(i + 1).toString().padStart(5, '0')}`,
        nome: nomes[i],
        tipo,
        cpf_cnpj: cpfCnpj,
        email: `cliente${i + 1}@exemplo.com.br`,
        fone: `(${Math.floor(10 + Math.random() * 90)}) ${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        celular: `(${Math.floor(10 + Math.random() * 90)}) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        data_cadastro: dataCadastro.toISOString().split('T')[0],
        data_alteracao: dataAlteracao.toISOString().split('T')[0],
        observacao: i % 2 === 0 ? `Observação para cliente ${i + 1}` : undefined,
        situacao: i < 8 ? 'A' : 'I',
        endereco: enderecos[i % enderecos.length]
      };
    });
  }
  
  /**
   * Gera pedidos fictícios para desenvolvimento
   * @param clientes Lista de clientes para associar aos pedidos
   * @returns Lista de pedidos mock
   */
  private gerarPedidosMock(clientes: Cliente[]): Pedido[] {
    const produtos = [
      { codigo: 'PROD001', descricao: 'Smartphone XYZ 128GB', unidade: 'UN', valor: 1999.90 },
      { codigo: 'PROD002', descricao: 'Notebook Ultra Slim 15"', unidade: 'UN', valor: 4500.00 },
      { codigo: 'PROD003', descricao: 'Smart TV 55" 4K', unidade: 'UN', valor: 3200.00 },
      { codigo: 'PROD004', descricao: 'Fone de Ouvido Bluetooth', unidade: 'UN', valor: 299.90 },
      { codigo: 'PROD005', descricao: 'Mouse Sem Fio', unidade: 'UN', valor: 89.90 },
      { codigo: 'PROD006', descricao: 'Teclado Mecânico RGB', unidade: 'UN', valor: 450.00 },
      { codigo: 'PROD007', descricao: 'Monitor 27" Full HD', unidade: 'UN', valor: 1200.00 },
      { codigo: 'PROD008', descricao: 'Câmera Digital 20MP', unidade: 'UN', valor: 1800.00 },
      { codigo: 'PROD009', descricao: 'Impressora Multifuncional', unidade: 'UN', valor: 950.00 },
      { codigo: 'PROD010', descricao: 'Pen Drive 128GB', unidade: 'UN', valor: 120.00 }
    ];
    
    const formasPagamento = [
      'Cartão de Crédito',
      'Boleto Bancário',
      'Transferência Bancária',
      'PIX',
      'Dinheiro'
    ];
    
    const formasFrete = [
      'PAC',
      'SEDEX',
      'Transportadora',
      'Retirada na Loja',
      'Entrega Própria'
    ];
    
    const statusPedidos = [
      StatusPedido.PENDENTE,
      StatusPedido.APROVADO,
      StatusPedido.EM_PRODUCAO,
      StatusPedido.PRONTO_PARA_ENVIO,
      StatusPedido.ENVIADO,
      StatusPedido.ENTREGUE,
      StatusPedido.FINALIZADO,
      StatusPedido.CANCELADO
    ];
    
    return Array.from({ length: 20 }, (_, i) => {
      const clienteIndex = Math.floor(Math.random() * clientes.length);
      const cliente = clientes[clienteIndex];
      
      const dataPedido = new Date();
      dataPedido.setDate(dataPedido.getDate() - Math.floor(Math.random() * 60));
      
      const dataCriacao = new Date(dataPedido);
      dataCriacao.setHours(dataCriacao.getHours() - Math.floor(Math.random() * 12));
      
      const dataModificacao = new Date(dataCriacao);
      dataModificacao.setHours(dataModificacao.getHours() + Math.floor(Math.random() * 24));
      
      // Gera itens para o pedido
      const numItens = Math.floor(1 + Math.random() * 5);
      const itens: ItemPedido[] = [];
      let valorTotal = 0;
      
      for (let j = 0; j < numItens; j++) {
        const produtoIndex = Math.floor(Math.random() * produtos.length);
        const produto = produtos[produtoIndex];
        const quantidade = Math.floor(1 + Math.random() * 3);
        const valorUnitario = produto.valor;
        const valorItemTotal = valorUnitario * quantidade;
        
        itens.push({
          id: `${i + 1}_${j + 1}`,
          codigo: produto.codigo,
          descricao: produto.descricao,
          unidade: produto.unidade,
          quantidade,
          valor_unitario: valorUnitario,
          valor_total: valorItemTotal
        });
        
        valorTotal += valorItemTotal;
      }
      
      const valorFrete = Math.random() > 0.3 ? Math.floor(15 + Math.random() * 50) : 0;
      const valorDesconto = Math.random() > 0.7 ? Math.floor(valorTotal * 0.05 * 100) / 100 : 0;
      
      return {
        id: `${i + 1}`,
        numero: `PED${(i + 1).toString().padStart(6, '0')}`,
        numero_ecommerce: Math.random() > 0.5 ? `EC${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        data_pedido: dataPedido.toISOString().split('T')[0],
        data_criacao: dataCriacao.toISOString(),
        data_modificacao: dataModificacao.toISOString(),
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj
        },
        situacao: statusPedidos[Math.floor(Math.random() * statusPedidos.length)],
        valor_total: valorTotal,
        valor_frete: valorFrete,
        valor_desconto: valorDesconto,
        itens,
        forma_pagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
        forma_frete: formasFrete[Math.floor(Math.random() * formasFrete.length)],
        observacoes: Math.random() > 0.7 ? `Observações para o pedido ${i + 1}` : undefined
      };
    });
  }
  
  /**
   * Busca clientes com os filtros informados
   * @param filtros Filtros de busca
   * @returns Lista de clientes
   */
  async getClientes(filtros?: FiltroCliente): Promise<Cliente[]> {
    console.info('[TinyMock] Buscando clientes com filtros:', filtros);
    
    let result = [...this.mockClientes];
    
    // Aplicar filtros
    if (filtros) {
      if (filtros.id) {
        result = result.filter(cliente => cliente.id === filtros.id);
      }
      
      if (filtros.nome) {
        const termoBusca = filtros.nome.toLowerCase();
        result = result.filter(cliente => 
          cliente.nome.toLowerCase().includes(termoBusca)
        );
      }
      
      if (filtros.cpf_cnpj) {
        result = result.filter(cliente => 
          cliente.cpf_cnpj.includes(filtros.cpf_cnpj!)
        );
      }
      
      if (filtros.email) {
        result = result.filter(cliente => 
          cliente.email.toLowerCase().includes(filtros.email!.toLowerCase())
        );
      }
      
      if (filtros.situacao) {
        result = result.filter(cliente => cliente.situacao === filtros.situacao);
      }
    }
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return result;
  }
  
  /**
   * Busca cliente por ID
   * @param id ID do cliente
   * @returns Dados do cliente
   */
  async getClienteById(id: string): Promise<Cliente> {
    console.info(`[TinyMock] Buscando cliente com ID: ${id}`);
    
    const cliente = this.mockClientes.find(c => c.id === id);
    
    if (!cliente) {
      throw new Error(`Cliente com ID ${id} não encontrado`);
    }
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return cliente;
  }
  
  /**
   * Cria um novo cliente
   * @param clienteDTO Dados do cliente
   * @returns ID do cliente criado
   */
  async createCliente(clienteDTO: ClienteDTO): Promise<string> {
    console.info('[TinyMock] Criando novo cliente:', clienteDTO);
    
    const novoId = (this.mockClientes.length + 1).toString();
    const codigo = `CLI${novoId.padStart(5, '0')}`;
    
    const dataCadastro = new Date();
    
    const novoCliente: Cliente = {
      id: novoId,
      codigo,
      nome: clienteDTO.nome,
      tipo: clienteDTO.tipo,
      cpf_cnpj: clienteDTO.cpf_cnpj,
      email: clienteDTO.email,
      fone: clienteDTO.fone,
      celular: clienteDTO.celular,
      data_cadastro: dataCadastro.toISOString().split('T')[0],
      data_alteracao: dataCadastro.toISOString().split('T')[0],
      observacao: clienteDTO.observacao,
      situacao: clienteDTO.situacao || 'A',
      endereco: clienteDTO.endereco
    };
    
    this.mockClientes.push(novoCliente);
    
    // Atualiza o cache
    CacheService.setItem('mock_clientes', this.mockClientes);
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return novoId;
  }
  
  /**
   * Atualiza dados de um cliente
   * @param id ID do cliente
   * @param clienteDTO Dados do cliente
   * @returns Verdadeiro se atualizado com sucesso
   */
  async updateCliente(id: string, clienteDTO: ClienteDTO): Promise<boolean> {
    console.info(`[TinyMock] Atualizando cliente ${id}:`, clienteDTO);
    
    const clienteIndex = this.mockClientes.findIndex(c => c.id === id);
    
    if (clienteIndex === -1) {
      throw new Error(`Cliente com ID ${id} não encontrado`);
    }
    
    const clienteAtual = this.mockClientes[clienteIndex];
    
    // Atualiza os dados do cliente
    this.mockClientes[clienteIndex] = {
      ...clienteAtual,
      nome: clienteDTO.nome,
      tipo: clienteDTO.tipo,
      cpf_cnpj: clienteDTO.cpf_cnpj,
      email: clienteDTO.email,
      fone: clienteDTO.fone,
      celular: clienteDTO.celular,
      observacao: clienteDTO.observacao,
      situacao: clienteDTO.situacao || clienteAtual.situacao,
      endereco: clienteDTO.endereco,
      data_alteracao: new Date().toISOString().split('T')[0]
    };
    
    // Atualiza o cache
    CacheService.setItem('mock_clientes', this.mockClientes);
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return true;
  }
  
  /**
   * Busca pedidos com os filtros informados
   * @param filtros Filtros de busca
   * @returns Lista de pedidos
   */
  async getPedidos(filtros?: FiltroPedido): Promise<Pedido[]> {
    console.info('[TinyMock] Buscando pedidos com filtros:', filtros);
    
    let result = [...this.mockPedidos];
    
    // Aplicar filtros
    if (filtros) {
      if (filtros.id) {
        result = result.filter(pedido => pedido.id === filtros.id);
      }
      
      if (filtros.numero) {
        result = result.filter(pedido => 
          pedido.numero.includes(filtros.numero!)
        );
      }
      
      if (filtros.cliente_id) {
        result = result.filter(pedido => 
          pedido.cliente.id === filtros.cliente_id
        );
      }
      
      if (filtros.cliente_nome) {
        const termoBusca = filtros.cliente_nome.toLowerCase();
        result = result.filter(pedido => 
          pedido.cliente.nome.toLowerCase().includes(termoBusca)
        );
      }
      
      if (filtros.situacao) {
        result = result.filter(pedido => pedido.situacao === filtros.situacao);
      }
      
      if (filtros.data_inicial) {
        const dataInicial = new Date(filtros.data_inicial);
        result = result.filter(pedido => {
          const dataPedido = new Date(pedido.data_pedido);
          return dataPedido >= dataInicial;
        });
      }
      
      if (filtros.data_final) {
        const dataFinal = new Date(filtros.data_final);
        dataFinal.setHours(23, 59, 59, 999); // Ajusta para fim do dia
        
        result = result.filter(pedido => {
          const dataPedido = new Date(pedido.data_pedido);
          return dataPedido <= dataFinal;
        });
      }
    }
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return result;
  }
  
  /**
   * Busca pedido por ID
   * @param id ID do pedido
   * @returns Dados do pedido
   */
  async getPedidoById(id: string): Promise<Pedido> {
    console.info(`[TinyMock] Buscando pedido com ID: ${id}`);
    
    const pedido = this.mockPedidos.find(p => p.id === id);
    
    if (!pedido) {
      throw new Error(`Pedido com ID ${id} não encontrado`);
    }
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return pedido;
  }
  
  /**
   * Atualiza o status de um pedido
   * @param id ID do pedido
   * @param status Novo status
   * @returns Verdadeiro se atualizado com sucesso
   */
  async updateStatusPedido(id: string, status: StatusPedido): Promise<boolean> {
    console.info(`[TinyMock] Atualizando status do pedido ${id} para ${status}`);
    
    const pedidoIndex = this.mockPedidos.findIndex(p => p.id === id);
    
    if (pedidoIndex === -1) {
      throw new Error(`Pedido com ID ${id} não encontrado`);
    }
    
    // Atualiza o status do pedido
    this.mockPedidos[pedidoIndex] = {
      ...this.mockPedidos[pedidoIndex],
      situacao: status,
      data_modificacao: new Date().toISOString()
    };
    
    // Atualiza o cache
    CacheService.setItem('mock_pedidos', this.mockPedidos);
    
    // Simulando um pequeno delay para ser mais realista
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return true;
  }
  
  /**
   * Limpa todos os dados mock e reinicia com valores padrão
   */
  async resetMockData(): Promise<void> {
    console.info('[TinyMock] Reiniciando dados mock');
    
    this.mockClientes = this.gerarClientesMock();
    this.mockPedidos = this.gerarPedidosMock(this.mockClientes);
    this.mockProdutos = this.gerarProdutosMock();
    
    CacheService.setItem('mock_clientes', this.mockClientes);
    CacheService.setItem('mock_pedidos', this.mockPedidos);
    CacheService.setItem('mock_produtos', this.mockProdutos);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.info('[TinyMock] Dados mock reiniciados com sucesso');
  }

  /**
   * Gera produtos fictícios para desenvolvimento
   * @returns Lista de produtos mock
   */
  private gerarProdutosMock(): Produto[] {
    const produtos = [
      { nome: 'Smartphone XYZ 128GB', preco: 1999.90, unidade: 'UN', estoque: 15 },
      { nome: 'Notebook Ultra Slim 15"', preco: 4500.00, unidade: 'UN', estoque: 8 },
      { nome: 'Smart TV 55" 4K', preco: 3200.00, unidade: 'UN', estoque: 12 },
      { nome: 'Fone de Ouvido Bluetooth', preco: 299.90, unidade: 'UN', estoque: 30 },
      { nome: 'Mouse Sem Fio', preco: 89.90, unidade: 'UN', estoque: 45 },
      { nome: 'Teclado Mecânico RGB', preco: 450.00, unidade: 'UN', estoque: 20 },
      { nome: 'Monitor 27" Full HD', preco: 1200.00, unidade: 'UN', estoque: 10 },
      { nome: 'Câmera Digital 20MP', preco: 1800.00, unidade: 'UN', estoque: 7 },
      { nome: 'Impressora Multifuncional', preco: 950.00, unidade: 'UN', estoque: 15 },
      { nome: 'Pen Drive 128GB', preco: 120.00, unidade: 'UN', estoque: 50 },
      { nome: 'HD Externo 1TB', preco: 420.00, unidade: 'UN', estoque: 22 },
      { nome: 'Roteador Wi-Fi', preco: 180.00, unidade: 'UN', estoque: 18 },
      { nome: 'Caixa de Som Bluetooth', preco: 250.00, unidade: 'UN', estoque: 25 },
      { nome: 'Carregador Portátil', preco: 150.00, unidade: 'UN', estoque: 35 },
      { nome: 'Tablet 10"', preco: 1500.00, unidade: 'UN', estoque: 10 }
    ];
    
    return produtos.map((item, i) => {
      const dataCadastro = new Date();
      dataCadastro.setMonth(dataCadastro.getMonth() - Math.floor(Math.random() * 12));
      
      const dataAlteracao = new Date(dataCadastro);
      dataAlteracao.setDate(dataAlteracao.getDate() + Math.floor(Math.random() * 30));
      
      const promo = Math.random() > 0.7;
      
      return {
        id: `${i + 1}`,
        codigo: `PROD${(i + 1).toString().padStart(3, '0')}`,
        nome: item.nome,
        preco: item.preco,
        preco_promocional: promo ? Math.floor(item.preco * 0.85 * 100) / 100 : undefined,
        unidade: item.unidade,
        estoque: item.estoque,
        ncm: '8471.30.19',
        origem: '0',
        gtin: `789${Math.floor(10000000000 + Math.random() * 90000000000)}`,
        descricao: `Descrição detalhada do produto ${item.nome}`,
        situacao: Math.random() > 0.1 ? 'A' : 'I',
        marca: ['Samsung', 'Apple', 'LG', 'Sony', 'Dell', 'HP', 'Logitech'][Math.floor(Math.random() * 7)],
        categoria: ['Eletrônicos', 'Informática', 'Acessórios', 'Áudio e Vídeo'][Math.floor(Math.random() * 4)],
        data_cadastro: dataCadastro.toISOString().split('T')[0],
        data_alteracao: dataAlteracao.toISOString().split('T')[0]
      };
    });
  }

  /**
   * Lista todos os produtos ou filtra por parâmetros
   * @param filtros Filtros opcionais
   * @returns Lista de produtos
   */
  async listarProdutos(filtros?: Record<string, any>): Promise<Produto[]> {
    console.log('[TinyMock] Listando produtos com filtros:', filtros);
    
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let produtos = [...this.mockProdutos];
    
    // Aplicar filtros se existirem
    if (filtros) {
      if (filtros.id) {
        produtos = produtos.filter(p => p.id === filtros.id);
      }
      
      if (filtros.codigo) {
        produtos = produtos.filter(p => p.codigo.includes(filtros.codigo));
      }
      
      if (filtros.nome) {
        const termo = filtros.nome.toLowerCase();
        produtos = produtos.filter(p => p.nome.toLowerCase().includes(termo));
      }
      
      if (filtros.marca) {
        const termo = filtros.marca.toLowerCase();
        produtos = produtos.filter(p => p.marca?.toLowerCase().includes(termo));
      }
      
      if (filtros.situacao) {
        produtos = produtos.filter(p => p.situacao === filtros.situacao);
      }
    }
    
    return produtos;
  }
} 