import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { 
  Cliente, 
  ClienteDTO, 
  FiltroCliente, 
  FiltroPedido, 
  Pedido, 
  StatusPedido, 
  TinyApiConfig,
  TinyApiResponse,
  PaginacaoResponse,
  Produto,
  PedidoDetalhado,
  ItemPedido,
  FiltroNotaFiscal,
  NotaFiscal,
  RespostaNotasFiscais,
  FiltroContaPagar,
  FiltroContaReceber,
  ContaPagar,
  ContaReceber,
  ResumoFinanceiro
} from '../../../types/tiny';
import { CacheService } from './CacheService';
import { TinyAuthService } from './TinyAuthService';
import { normalizarRespostaClientes, normalizarRespostaPedidos } from './schemas';

/**
 * Classe para comunicação com a API do Tiny v2.0 e v3.0
 */
export class TinyApiService {
  private apiV2Url: string;
  private apiV3Url: string;
  private token: string;
  private httpClientV2: AxiosInstance;
  private httpClientV3: AxiosInstance;
  private useCache: boolean;
  private cacheExpiration: number;
  private useOAuth: boolean;
  private authService: TinyAuthService | null = null;
  
  /**
   * Construtor do serviço de API do Tiny
   * @param config Configuração da API
   */
  constructor(config: TinyApiConfig) {
    this.token = config.token;
    this.apiV2Url = config.baseUrl || 'https://api.tiny.com.br/api2/';
    this.apiV3Url = config.apiV3Url || 'https://api.tiny.com.br/api2/'; // Nota: API v3 usa o mesmo base URL + oauth2
    this.useCache = config.cache !== undefined ? config.cache : false; // Desativando cache por padrão
    this.cacheExpiration = config.cacheExpiration || 3600000; // 1 hora por padrão
    this.useOAuth = config.useOAuth !== undefined ? config.useOAuth : false;
    
    // Configuração do cliente HTTP para API v2
    this.httpClientV2 = axios.create({
      baseURL: this.apiV2Url,
      timeout: config.timeout || 15000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    // Interceptor para adicionar token em todas as requisições v2
    this.httpClientV2.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (config.params) {
        config.params.token = this.token;
        config.params.formato = 'json';
      } else {
        config.params = { token: this.token, formato: 'json' };
      }
      
      console.log(`[TinyAPI] Requisição para: ${config.url} com params:`, config.params);
      return config;
    });
    
    // Configuração do cliente HTTP para API v3 (usando OAuth)
    this.httpClientV3 = axios.create({
      baseURL: this.apiV2Url, // Usamos o mesmo baseURL, o path é que muda
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Se estiver usando OAuth, inicializa o serviço de autenticação
    if (this.useOAuth) {
      this.authService = new TinyAuthService(config);
      
      // Interceptor para adicionar token OAuth em todas as requisições v3
      this.httpClientV3.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        try {
          // Obtém o token de acesso
          const accessToken = await this.authService!.getAccessToken();
          
          // Adiciona o token no header Authorization
          config.headers = config.headers || {} as AxiosRequestHeaders;
          config.headers.Authorization = `Bearer ${accessToken}`;
          
          // Adiciona o token também como parâmetro (alguns endpoints do Tiny exigem ambos)
          if (config.params) {
            config.params.access_token = accessToken;
          } else {
            config.params = { access_token: accessToken };
          }
          
          console.log('[TinyAPI] Adicionando token OAuth à requisição');
          return config;
        } catch (error) {
          console.error('[TinyAPI] Erro ao obter token para requisição:', error);
          return Promise.reject(error);
        }
      });
    }
    
    // Interceptor para tratamento de erros para ambos os clientes
    const errorHandler = (error: any) => {
      console.error('[TinyAPI] Erro na requisição:', error.message);
      
      // Log adicional para diagnóstico
      if (axios.isAxiosError(error) && error.response) {
        console.error('[TinyAPI] Resposta do servidor:', error.response.data);
        console.error('[TinyAPI] Status code:', error.response.status);
      }
      
      // Se for erro de autenticação e estiver usando OAuth, tenta renovar o token
      if (this.useOAuth && this.authService && error.response && error.response.status === 401) {
        console.log('[TinyAPI] Tentando renovar token de acesso...');
        
        // Remover o token atual do cache para forçar renovação
        CacheService.removeItem('tiny_oauth_access_token');
        
        // A próxima requisição irá obter um novo token automaticamente
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    };
    
    this.httpClientV2.interceptors.response.use(response => response, errorHandler);
    this.httpClientV3.interceptors.response.use(response => response, errorHandler);
  }
  
  /**
   * Obtém o cliente HTTP apropriado com base na versão da API
   * @returns Instância do cliente HTTP
   */
  private getHttpClient(): AxiosInstance {
    return this.useOAuth ? this.httpClientV3 : this.httpClientV2;
  }
  
  /**
   * Busca clientes com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de clientes
   */
  async getClientes(
    filtros?: FiltroCliente,
    forceRefresh = false
  ): Promise<Cliente[]> {
    const cacheKey = `clientes_${JSON.stringify(filtros||{})}`;
    
    console.log(`🔍 [TinyAPI] Buscando clientes com filtros:`, filtros);
    console.log(`🔧 [TinyAPI] forceRefresh: ${forceRefresh}, useCache: ${this.useCache}`);
    
    // CORRIGIDO: Só usar cache se useCache=true E forceRefresh=false
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<Cliente[]>(cacheKey);
      if (cached) {
        console.log('📦 [TinyAPI] Usando clientes em cache');
        return cached;
      }
    } else if (forceRefresh) {
      console.log('🔄 [TinyAPI] Ignorando cache devido a forceRefresh=true');
    }

    try {
      const parametros = this.formatarFiltrosCliente(filtros);
      console.log(`📤 [TinyAPI] Parâmetros da requisição:`, parametros);

      const resp = await this.httpClientV2.get(
        'contatos.pesquisa.php',
        { params: parametros }
      );
      
      console.log(`📥 [TinyAPI] Resposta bruta da API:`, resp.data);
      
      const r = resp.data.retorno;
      if (r.status === 'Erro') {
        const erro = r.erros?.[0]?.erro || 'Erro ao buscar clientes';
        console.error(`❌ [TinyAPI] Erro da API:`, erro);
        throw new Error(erro);
      }

      // --- extrai rawContatos em qualquer formato ---
      let raw: any[] = [];
      if (Array.isArray(r.contatos)) {
        // novo formato: [{contato:{…}}, …]
        raw = r.contatos.map((x: any) => x.contato);
        console.log(`📋 [TinyAPI] Formato novo detectado: ${raw.length} contatos`);
      } else if (r.contatos?.contato) {
        // legado: {contato: {...}} ou {contato: [...]}
        const c = r.contatos.contato;
        raw = Array.isArray(c) ? c : [c];
        console.log(`📋 [TinyAPI] Formato legado detectado: ${raw.length} contatos`);
      } else {
        console.log(`❌ [TinyAPI] Nenhum contato encontrado na estrutura da resposta`);
      }

      // --- agora transforma em Cliente[] consistente ---
      const clientes: Cliente[] = raw.map((c: any) => {
        // Debug da situação para entender o problema
        console.log(`🔍 [Debug] Cliente ${c.nome}: situacao="${c.situacao}", status="${c.status}", ativo="${c.ativo}"`);
        
        // Lógica melhorada para determinar situação
        let situacao = 'A'; // default ativo
        if (c.situacao) {
          situacao = c.situacao;
        } else if (c.status) {
          // Mapear status comum para situação
          if (c.status === 'Ativo' || c.status === 'ativo' || c.status === 'A') {
            situacao = 'A';
          } else if (c.status === 'Inativo' || c.status === 'inativo' || c.status === 'I') {
            situacao = 'I';
          }
        } else if (c.ativo !== undefined) {
          situacao = c.ativo ? 'A' : 'I';
        }
        
        return {
          id: c.id,
          codigo: c.codigo || c.id || '',
          nome: c.nome || c.fantasia || '-',
          tipo: c.tipo_pessoa || c.tipo || 'F',
          cpf_cnpj: c.cpf_cnpj?.replace(/\D/g,'')  // normaliza "463.707.960-00" -> "46370796000"
            || c.cpfCnpj?.replace(/\D/g,'') || '',
          email: c.email || c.email_principal || '-',
          fone: c.fone || c.telefone || '-',
          celular: c.celular || c.cel || '',
          data_cadastro: c.data_criacao || c.dataCadastro || c.data_cadastro || '',
          data_alteracao: c.data_alteracao || c.dataAlteracao || '',
          situacao: situacao,
          observacao: c.observacao || c.obs || '',
          endereco: this.normalizarEndereco(c.endereco || c.address || {})
        };
      });

      console.log(`✅ [TinyAPI] ${clientes.length} clientes processados com sucesso`);
      
      if (clientes.length > 0) {
        console.log(`📋 [TinyAPI] Primeiros 3 clientes:`, clientes.slice(0, 3).map(c => ({ id: c.id, nome: c.nome })));
      }
      
      // CORRIGIDO: Só armazenar em cache se não foi forceRefresh
      if (this.useCache && !forceRefresh) {
        CacheService.setItem(cacheKey, clientes);
        console.log(`💾 [TinyAPI] Clientes armazenados em cache`);
      } else {
        console.log(`🚫 [TinyAPI] Cache não utilizado (forceRefresh=${forceRefresh})`);
      }
      
      return clientes;
    } catch (error) {
      console.error(`❌ [TinyAPI] Erro ao buscar clientes:`, error);
      throw error;
    }
  }
  
  /**
   * Normaliza os dados de clientes para um formato consistente
   * @param rawClientes Dados brutos de clientes da API
   * @returns Lista de clientes normalizada
   */
  private normalizarClientes(rawClientes: any[]): Cliente[] {
    return rawClientes.map(raw => ({
      id: raw.id?.toString() || '',
      codigo: raw.codigo || raw.code || raw.id?.toString() || '',
      nome: raw.nome || raw.name || '',
      tipo: raw.tipo_pessoa || raw.tipo || raw.type || 'F',
      cpf_cnpj: raw.cpf_cnpj || raw.documento || raw.document || '',
      email: raw.email || raw.e_mail || '',
      fone: raw.fone || raw.telefone || raw.phone || '',
      celular: raw.celular || raw.cel || raw.mobile_phone || '',
      data_cadastro: raw.data_cadastro || raw.dataCadastro || raw.created_at || '',
      data_alteracao: raw.data_alteracao || raw.dataAlteracao || raw.updated_at || '',
      situacao: raw.situacao || raw.status || 'A',
      observacao: raw.observacao || raw.obs || raw.notes || '',
      endereco: this.normalizarEndereco(raw.endereco || raw.address || {})
    }));
  }
  
  /**
   * Normaliza os dados de endereço
   * @param rawEndereco Dados brutos de endereço
   * @returns Objeto de endereço normalizado
   */
  private normalizarEndereco(rawEndereco: any): any {
    // Se for string, retorna objeto vazio (algumas APIs retornam string em vez de objeto)
    if (typeof rawEndereco === 'string') {
      return {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: ''
      };
    }
    
    return {
      logradouro: rawEndereco.logradouro || rawEndereco.endereco || rawEndereco.street || '',
      numero: rawEndereco.numero || rawEndereco.number || '',
      complemento: rawEndereco.complemento || rawEndereco.complement || '',
      bairro: rawEndereco.bairro || rawEndereco.district || '',
      cep: rawEndereco.cep || rawEndereco.zip_code || rawEndereco.zipCode || '',
      cidade: rawEndereco.cidade || rawEndereco.city || '',
      uf: rawEndereco.uf || rawEndereco.estado || rawEndereco.state || ''
    };
  }
  
  /**
   * Busca cliente por ID
   * @param id ID do cliente
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados do cliente
   */
  async getClienteById(id: string, forceRefresh: boolean = false): Promise<Cliente> {
    const cacheKey = `cliente_${id}`;
    
    // Verifica se há dados em cache
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<Cliente>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    try {
      // API v2 (token)
      const response = await this.httpClientV2.get(
        'contato.obter.php', // Endpoint correto conforme documentação
        { params: { id } }
      );
      
      if (!response.data || !response.data.retorno) {
        throw new Error('Formato de resposta inválido da API Tiny');
      }
      
      // Normalizar dados do cliente
      const rawCliente = response.data.retorno.contato;
      const cliente = this.normalizarClientes([rawCliente])[0];
      
      // Armazena em cache
      if (this.useCache) {
        CacheService.setItem(cacheKey, cliente, this.cacheExpiration);
      }
      
      return cliente;
    } catch (error) {
      console.error(`[TinyAPI] Erro ao buscar cliente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria um novo cliente
   * @param cliente Dados do cliente a ser criado
   * @returns ID do cliente criado
   */
  async createCliente(cliente: ClienteDTO): Promise<string> {
    try {
      // API v2 (token)
      // Formatando dados para o formato esperado pela API v2
      const params = new URLSearchParams();
      params.append('contato', JSON.stringify(cliente));
      
      const response = await this.httpClientV2.post(
        'contato.incluir.php', // Endpoint correto conforme documentação
        params
      );
      
      if (!response.data || !response.data.retorno) {
        throw new Error('Formato de resposta inválido da API Tiny');
      }
      
      if (response.data.retorno.status === 'Erro') {
        throw new Error(`Erro ao criar cliente: ${response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido'}`);
      }
      
      return response.data.retorno.id;
    } catch (error) {
      console.error('[TinyAPI] Erro ao criar cliente:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza os dados de um cliente existente
   * @param id ID do cliente a ser atualizado
   * @param cliente Novos dados do cliente
   * @returns Sucesso da operação
   */
  async updateCliente(id: string, cliente: ClienteDTO): Promise<boolean> {
    try {
      // API v2 (token)
      // Formatando dados para o formato esperado pela API v2
      const params = new URLSearchParams();
      // Cria uma cópia do objeto cliente e adiciona o ID
      const clienteComId = { ...cliente, id };
      params.append('contato', JSON.stringify(clienteComId));
      
      const response = await this.httpClientV2.post(
        'contato.alterar.php', // Endpoint correto conforme documentação
        params
      );
      
      if (!response.data || !response.data.retorno) {
        throw new Error('Formato de resposta inválido da API Tiny');
      }
      
      if (response.data.retorno.status === 'Erro') {
        throw new Error(`Erro ao atualizar cliente: ${response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido'}`);
      }
      
      // Remover item do cache, se estiver usando cache
      if (this.useCache) {
        CacheService.removeItem(`cliente_${id}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[TinyAPI] Erro ao atualizar cliente ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Busca pedidos com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de pedidos
   */
  async getPedidos(
    filtros?: FiltroPedido,
    forceRefresh = false
  ): Promise<Pedido[]> {
    const cacheKey = `pedidos_${JSON.stringify(filtros||{})}`;
    
    console.log(`🔍 [TinyAPI] Buscando pedidos com filtros:`, filtros);
    console.log(`🔧 [TinyAPI] forceRefresh: ${forceRefresh}, useCache: ${this.useCache}`);
    
    // CORRIGIDO: Só usar cache se useCache=true E forceRefresh=false
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<Pedido[]>(cacheKey);
      if (cached) {
        console.log('📦 [TinyAPI] Usando pedidos em cache');
        return cached;
      }
    } else if (forceRefresh) {
      console.log('🔄 [TinyAPI] Ignorando cache devido a forceRefresh=true');
    }

    try {
      // Construir parâmetros - A API exige pelo menos um filtro
      const params: Record<string, any> = {
        registros_por_pagina: filtros?.registros_por_pagina || 100,
        // formato: 'json' // formato é adicionado pelo interceptor
      };
      
      // Se não há filtros específicos, adicionar filtro de data amplo para pegar todos os pedidos
      let temFiltro = false;
      
      // Adiciona situacao apenas se for fornecido explicitamente e não for 'todos'
      if (filtros?.situacao && filtros.situacao !== 'todos') {
        params.situacao = filtros.situacao;
        temFiltro = true;
      }
      
      // Adiciona outros filtros quando fornecidos
      if (filtros?.id) {
        params.id = filtros.id;
        temFiltro = true;
      }
      if (filtros?.numero) {
        params.numero = filtros.numero;
        temFiltro = true;
      }
      if (filtros?.cliente_id) {
        params.cliente_id = filtros.cliente_id;
        temFiltro = true;
      }
      if (filtros?.cliente_nome) {
        params.cliente = filtros.cliente_nome; // API usa "cliente", não "cliente_nome"
        temFiltro = true;
      }
      if (filtros?.data_inicial) {
        params.dataInicial = filtros.data_inicial; // API usa "dataInicial"
        temFiltro = true;
      }
      if (filtros?.data_final) {
        params.dataFinal = filtros.data_final; // API usa "dataFinal"
        temFiltro = true;
      }
      if (filtros?.pagina) {
        params.pagina = filtros.pagina;
      }
      
      // Se não há nenhum filtro específico, adicionar um filtro de data amplo
      if (!temFiltro) {
        // Buscar pedidos do último ano para garantir que haja dados
        const hoje = new Date();
        const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
        
        params.dataInicial = umAnoAtras.toLocaleDateString('pt-BR'); // formato dd/mm/yyyy
        params.dataFinal = hoje.toLocaleDateString('pt-BR');
        console.log(`[TinyAPI] Aplicando filtro de data padrão: ${params.dataInicial} até ${params.dataFinal}`);
      }
      
      const resp = await this.httpClientV2.get<TinyApiResponse<any>>(
        'pedidos.pesquisa.php',
        { params }
      );
      
      console.group('[TinyAPI] — getPedidos debug');
      console.log('→ Parâmetros de requisição:', params);
      console.log('→ Resposta completa da API:', resp.data);
      
      // Se a API retornou status OK
      if (resp.data.retorno.status === 'OK') {
        const wrapper = resp.data.retorno.pedidos;
        console.log('→ wrapper (resp.data.retorno.pedidos):', wrapper);

        // Extrair pedidos corretamente - cada item é {pedido: {...}}
        let rawPedidos: any[] = [];
        if (Array.isArray(wrapper)) {
          // Extrair o objeto "pedido" de cada item
          rawPedidos = wrapper.map(item => item.pedido || item);
        } else if (wrapper?.pedido) {
          // Caso seja um único pedido
          rawPedidos = Array.isArray(wrapper.pedido) ? wrapper.pedido : [wrapper.pedido];
        }
        
        console.log('→ raw (array de pedidos extraídos):', rawPedidos);
        
        if (Array.isArray(rawPedidos) && rawPedidos.length > 0) {
          const parseValor = (val: any): number => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            
            console.log(`[TinyAPI] parseValor recebeu:`, { valor: val, tipo: typeof val });
            
            // Converter para string primeiro
            let strVal = String(val).trim();
            
            // Se a string está vazia após limpeza, retorna 0
            if (!strVal) return 0;
            
            // Remover símbolos monetários e espaços
            strVal = strVal.replace(/[R$\s]/g, '');
            
            // NOVA LÓGICA: A API do Tiny retorna valores em centavos
            // Exemplo: "78840" = R$ 788,40 (não R$ 78.840,00)
            
            // Se contém apenas dígitos (formato da API em centavos)
            if (/^\d+$/.test(strVal)) {
              const resultado = parseInt(strVal, 10) / 100; // Dividir por 100 para converter centavos
              console.log(`[TinyAPI] parseValor (centavos) converteu "${val}" -> ${resultado}`);
              return resultado;
            }
            
            // Padrão 1: Formato com vírgula decimal brasileira (1.234,56)
            if (strVal.includes(',')) {
              // Remove pontos (separadores de milhares) e converte vírgula para ponto
              strVal = strVal.replace(/\./g, '').replace(',', '.');
              const resultado = parseFloat(strVal);
              const final = isNaN(resultado) ? 0 : resultado;
              console.log(`[TinyAPI] parseValor (formato brasileiro) converteu "${val}" -> "${strVal}" -> ${final}`);
              return final;
            }
            
            // Padrão 2: Formato americano com ponto decimal (1234.56)
            if (/^\d+\.\d{1,2}$/.test(strVal)) {
              const resultado = parseFloat(strVal);
              console.log(`[TinyAPI] parseValor (formato americano) converteu "${val}" -> ${resultado}`);
              return resultado;
            }
            
            // Padrão 3: Formato com separadores de milhares sem decimais (1.234)
            if (/^\d{1,3}(\.\d{3})+$/.test(strVal)) {
              // Assumir que são separadores de milhares, não decimais
              const valorSemPontos = strVal.replace(/\./g, '');
              const resultado = parseInt(valorSemPontos, 10) / 100; // Tratar como centavos
              console.log(`[TinyAPI] parseValor (milhares como centavos) converteu "${val}" -> "${valorSemPontos}" -> ${resultado}`);
              return resultado;
            }
            
            // Fallback: tenta parseFloat direto
            const num = parseFloat(strVal);
            const resultado = isNaN(num) ? 0 : num;
            console.log(`[TinyAPI] parseValor (fallback) converteu "${val}" -> "${strVal}" -> ${resultado}`);
            return resultado;
          };
          
          const pedidosNormalized: Pedido[] = rawPedidos
            .filter((p: any) => {
              // Filtrar apenas pedidos que têm dados válidos
              const temId = p.id && p.id.toString() !== '';
              const temNumero = p.numero && p.numero.toString() !== '';
              
              if (!temId || !temNumero) {
                console.log('→ pedido descartado por falta de dados essenciais:', p);
                return false;
              }
              return true;
            })
            .map((p: any) => {
              console.log('→ processando pedido individual:', p);
              
              // Usar campos exatos da documentação da API
              const clienteNome = p.nome || '-'; // Campo "nome" conforme documentação
              const clienteCpfCnpj = p.cpf_cnpj || '';
              const clienteId = p.id_cliente || '';
              
              return {
                id: p.id?.toString() || '',
                numero: p.numero?.toString() || '-',
                numero_ecommerce: p.numero_ecommerce?.toString() || '',
                data_pedido: p.data_pedido || '',
                data_criacao: p.data_criacao || p.data_pedido || '',
                data_modificacao: p.data_modificacao || '',
                valor_total: parseValor(p.valor || p.valor_total || 0), // API usa "valor"
                situacao: p.situacao || 'desconhecido',
                cliente: {
                  id: clienteId,
                  nome: clienteNome,
                  cpf_cnpj: clienteCpfCnpj
                },
                itens: p.itens || [],
                forma_pagamento: p.forma_pagamento || '',
                forma_frete: p.forma_frete || '',
                observacoes: p.observacoes || ''
              };
            });
          
          console.log('→ pedidos normalizados:', pedidosNormalized);
          console.groupEnd();
          
          // CORRIGIDO: Só armazenar em cache se não foi forceRefresh
          if (this.useCache && !forceRefresh) {
            CacheService.setItem(cacheKey, pedidosNormalized, this.cacheExpiration);
            console.log(`💾 [TinyAPI] Pedidos armazenados em cache`);
          } else {
            console.log(`🚫 [TinyAPI] Cache não utilizado (forceRefresh=${forceRefresh})`);
          }
          
          return pedidosNormalized;
        } else {
          console.log('[TinyAPI] Nenhum pedido encontrado nos dados extraídos.');
          console.groupEnd();
          return [];
        }
      } else if (resp.data.retorno.status === 'Erro') {
        const erroMsg = resp.data.retorno.erros?.[0]?.erro || 'Erro ao buscar pedidos';
        console.error(`[TinyAPI] Erro retornado pela API: ${erroMsg}`);
        console.groupEnd();
        throw new Error(erroMsg);
      } else {
        console.log('[TinyAPI] Status desconhecido na resposta:', resp.data.retorno.status);
        console.groupEnd();
        return [];
      }
    } catch (error: any) {
      console.error('[TinyAPI] Erro ao buscar pedidos (catch geral):', error);
      console.groupEnd();
      throw error;
    }
  }
  
  /**
   * Busca pedido por ID
   * @param id ID do pedido
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados do pedido
   */
  async getPedidoById(id: string, forceRefresh: boolean = false): Promise<PedidoDetalhado> {
    if (!id) {
      throw new Error('O ID do pedido é obrigatório');
    }
    
    const cacheKey = `pedido_detalhado_${id}`;
    
    // Verifica se há dados em cache
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<PedidoDetalhado>(cacheKey);
      if (cached) {
        console.log('[TinyAPI] Usando dados detalhados do pedido em cache');
        return cached;
      }
    }
    
    try {
      console.log(`[TinyAPI] Buscando detalhes do pedido ID: ${id}`);
      
      // Parâmetros obrigatórios para o endpoint
      const params = {
        id: id,
        formato: 'json'
      };
      
      console.log('[TinyAPI] Parâmetros da requisição:', params);
      
      // Endpoint correto: pedido.obter.php (no singular)
      const response = await this.httpClientV2.get(
        'pedido.obter.php', 
        { params }
      );
      
      // Log completo da resposta para debug
      console.log('[TinyAPI] Resposta completa do detalhe do pedido:', JSON.stringify(response.data));
      
      if (!response.data || !response.data.retorno) {
        throw new Error('Formato de resposta inválido da API Tiny');
      }
      
      if (response.data.retorno.status === 'Erro') {
        const erro = response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido';
        console.error(`[TinyAPI] Erro retornado pela API: ${erro}`);
        throw new Error(`Erro ao buscar pedido: ${erro}`);
      }
      
      // Extrair o pedido da resposta
      const dadosPedido = response.data.retorno.pedido;
      
      if (!dadosPedido) {
        console.error('[TinyAPI] Pedido não encontrado na resposta');
        throw new Error('Pedido não encontrado ou formato inválido');
      }
      
      console.log('[TinyAPI] Dados brutos do pedido:', JSON.stringify(dadosPedido));
      
      // Converter string para número
      const parseValor = (val: any): number => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        
        console.log(`[TinyAPI] parseValor recebeu:`, { valor: val, tipo: typeof val });
        
        // Converter para string primeiro
        let strVal = String(val).trim();
        
        // Se a string está vazia após limpeza, retorna 0
        if (!strVal) return 0;
        
        // Remover símbolos monetários e espaços
        strVal = strVal.replace(/[R$\s]/g, '');
        
        // NOVA LÓGICA: A API do Tiny retorna valores em centavos
        // Exemplo: "78840" = R$ 788,40 (não R$ 78.840,00)
        
        // Se contém apenas dígitos (formato da API em centavos)
        if (/^\d+$/.test(strVal)) {
          const resultado = parseInt(strVal, 10) / 100; // Dividir por 100 para converter centavos
          console.log(`[TinyAPI] parseValor (centavos) converteu "${val}" -> ${resultado}`);
          return resultado;
        }
        
        // Padrão 1: Formato com vírgula decimal brasileira (1.234,56)
        if (strVal.includes(',')) {
          // Remove pontos (separadores de milhares) e converte vírgula para ponto
          strVal = strVal.replace(/\./g, '').replace(',', '.');
          const resultado = parseFloat(strVal);
          const final = isNaN(resultado) ? 0 : resultado;
          console.log(`[TinyAPI] parseValor (formato brasileiro) converteu "${val}" -> "${strVal}" -> ${final}`);
          return final;
        }
        
        // Padrão 2: Formato americano com ponto decimal (1234.56)
        if (/^\d+\.\d{1,2}$/.test(strVal)) {
          const resultado = parseFloat(strVal);
          console.log(`[TinyAPI] parseValor (formato americano) converteu "${val}" -> ${resultado}`);
          return resultado;
        }
        
        // Padrão 3: Formato com separadores de milhares sem decimais (1.234)
        if (/^\d{1,3}(\.\d{3})+$/.test(strVal)) {
          // Assumir que são separadores de milhares, não decimais
          const valorSemPontos = strVal.replace(/\./g, '');
          const resultado = parseInt(valorSemPontos, 10) / 100; // Tratar como centavos
          console.log(`[TinyAPI] parseValor (milhares como centavos) converteu "${val}" -> "${valorSemPontos}" -> ${resultado}`);
          return resultado;
        }
        
        // Fallback: tenta parseFloat direto
        const num = parseFloat(strVal);
        const resultado = isNaN(num) ? 0 : num;
        console.log(`[TinyAPI] parseValor (fallback) converteu "${val}" -> "${strVal}" -> ${resultado}`);
        return resultado;
      };
      
      // Normalizar itens do pedido
      const itens: ItemPedido[] = [];
      
      // Verificar se há itens no pedido
      if (dadosPedido.itens) {
        // Os itens podem vir em formatos diferentes conforme documentação
        let itensArray: any[] = [];
        
        if (Array.isArray(dadosPedido.itens)) {
          // Formato 1: array de itens diretamente [{item: {...}}, {item: {...}}]
          itensArray = dadosPedido.itens.map((wrapper: any) => wrapper.item || wrapper);
        } else if (dadosPedido.itens.item && Array.isArray(dadosPedido.itens.item)) {
          // Formato 2: { itens: { item: [{...}, {...}] } }
          itensArray = dadosPedido.itens.item;
        } else if (dadosPedido.itens.item && typeof dadosPedido.itens.item === 'object') {
          // Formato 3: { itens: { item: {...} } } (um único item)
          itensArray = [dadosPedido.itens.item];
        }
        
        console.log(`[TinyAPI] ${itensArray.length} itens encontrados no formato:`, itensArray);
        
        // Mapear itens para o formato padronizado
        itensArray.forEach((item: any) => {
          console.log(`[TinyAPI] Item bruto recebido:`, JSON.stringify(item, null, 2));
          
          const valorUnitario = parseValor(item.valor_unitario || item.valorUnitario || item.precoUnitario || 0);
          const quantidade = parseValor(item.quantidade || item.qtde || 0);
          const valorTotal = parseValor(item.valor_total || item.valorTotal || item.valor || (quantidade * valorUnitario) || 0);
          
          console.log(`[TinyAPI] Processando item:`, {
            codigo: item.codigo,
            descricao: item.descricao,
            valor_unitario_original: item.valor_unitario,
            valorUnitario_original: item.valorUnitario, 
            precoUnitario_original: item.precoUnitario,
            quantidade_original: item.quantidade,
            qtde_original: item.qtde,
            valor_total_original: item.valor_total,
            valorTotal_original: item.valorTotal,
            valor_original: item.valor,
            // Valores processados:
            quantidade_processada: quantidade,
            valor_unitario_processado: valorUnitario,
            valor_total_processado: valorTotal
          });
          
          itens.push({
            id: item.id?.toString() || '',
            codigo: item.codigo || item.produto_codigo || item.codigo_produto || '',
            descricao: item.descricao || item.produto || item.nome_produto || '',
            unidade: item.unidade || item.un || 'UN',
            quantidade: quantidade,
            valor_unitario: valorUnitario,
            valor_total: valorTotal
          });
        });
      }
      
      // Extrair valores para logging - usar nomes corretos da documentação
      const valorProdutos = parseValor(dadosPedido.total_produtos || dadosPedido.valor_produtos || dadosPedido.valorProdutos || dadosPedido.produtos_valor || 0);
      const valorFrete = parseValor(dadosPedido.valor_frete || dadosPedido.valorFrete || dadosPedido.frete_valor || 0);
      const valorDesconto = parseValor(dadosPedido.valor_desconto || dadosPedido.valorDesconto || dadosPedido.desconto_valor || 0);
      const valorTotal = parseValor(dadosPedido.total_pedido || dadosPedido.valor_total || dadosPedido.valorTotal || dadosPedido.valor || 0);
      
      console.log(`[TinyAPI] Valores extraídos: produtos=${valorProdutos}, frete=${valorFrete}, desconto=${valorDesconto}, total=${valorTotal}`);
      
      // Log detalhado dos campos de valor encontrados
      console.log(`[TinyAPI] Campos de valor disponíveis no pedido:`, {
        total_produtos: dadosPedido.total_produtos,
        valor_produtos: dadosPedido.valor_produtos,
        valorProdutos: dadosPedido.valorProdutos,
        produtos_valor: dadosPedido.produtos_valor,
        valor_frete: dadosPedido.valor_frete,
        valorFrete: dadosPedido.valorFrete,
        frete_valor: dadosPedido.frete_valor,
        valor_desconto: dadosPedido.valor_desconto,
        valorDesconto: dadosPedido.valorDesconto,
        desconto_valor: dadosPedido.desconto_valor,
        total_pedido: dadosPedido.total_pedido,
        valor_total: dadosPedido.valor_total,
        valorTotal: dadosPedido.valorTotal,
        valor: dadosPedido.valor
      });
      
      // Criar objeto normalizado
      const pedidoDetalhado: PedidoDetalhado = {
        id: dadosPedido.id?.toString() || '',
        numero: dadosPedido.numero?.toString() || dadosPedido.numeroPedido?.toString() || '-',
        numero_ecommerce: dadosPedido.numero_ecommerce?.toString() || dadosPedido.numeroEcommerce?.toString() || '',
        data_pedido: dadosPedido.data_pedido || dadosPedido.dataPedido || '',
        data_criacao: dadosPedido.data_criacao || dadosPedido.dataCriacao || dadosPedido.data_pedido || '',
        ultima_atualizacao: dadosPedido.data_alteracao || dadosPedido.dataAlteracao || '',
        nome_cliente: dadosPedido.cliente?.nome || dadosPedido.nome_cliente || dadosPedido.nomeCliente || '-',
        cpf_cnpj_cliente: dadosPedido.cliente?.cpf_cnpj || dadosPedido.cpf_cnpj || dadosPedido.cpfCnpj || '',
        valor_produtos: valorProdutos,
        valor_frete: valorFrete,
        valor_desconto: valorDesconto,
        valor_total: valorTotal,
        situacao: dadosPedido.situacao || dadosPedido.status || 'desconhecido',
        forma_pagamento: dadosPedido.forma_pagamento || dadosPedido.formaPagamento || '',
        forma_frete: dadosPedido.forma_frete || dadosPedido.formaFrete || dadosPedido.tipo_frete || '',
        observacoes: dadosPedido.observacoes || dadosPedido.observacao || dadosPedido.obs || '',
        itens
      };
      
      console.log('[TinyAPI] Pedido normalizado com sucesso:', pedidoDetalhado);
      
      // Armazenar em cache
      if (this.useCache) {
        CacheService.setItem(cacheKey, pedidoDetalhado, this.cacheExpiration);
      }
      
      return pedidoDetalhado;
    } catch (error) {
      console.error(`[TinyAPI] Erro ao buscar detalhes do pedido ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Atualiza o status de um pedido
   * @param id ID do pedido
   * @param status Novo status
   * @returns Verdadeiro se atualizado com sucesso
   */
  async updateStatusPedido(id: string, status: StatusPedido): Promise<boolean> {
    try {
      const response = await this.getHttpClient().put<TinyApiResponse<{ sucesso: boolean }>>(
        'pedido.alterar.situacao.php', 
        { id, situacao: status }
      );
      
      if (response.data.status === 'Erro') {
        throw new Error(`Erro ao atualizar status do pedido: ${response.data.erro}`);
      }
      
      // Limpa cache do pedido
      if (this.useCache) {
        CacheService.removeItem(`pedido_${id}`);
        CacheService.removeItem('pedidos_{}');
      }
      
      return response.data.retorno.sucesso;
    } catch (error) {
      console.error(`[TinyAPI] Erro ao atualizar status do pedido ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Formata os filtros de busca de clientes para o formato esperado pela API
   * @param filtros Filtros de busca
   * @returns Filtros formatados
   */
  private formatarFiltrosCliente(filtros?: FiltroCliente): Record<string, any> {
    if (!filtros) {
      return {};
    }
    
    const params: Record<string, any> = {};
    
    if (filtros.id) params.id = filtros.id;
    if (filtros.cpf_cnpj) params.cpf_cnpj = filtros.cpf_cnpj;
    if (filtros.nome) params.nome = filtros.nome;
    if (filtros.email) params.email = filtros.email;
    if (filtros.situacao) params.situacao = filtros.situacao;
    if (filtros.pagina) params.pagina = filtros.pagina;
    if (filtros.registros_por_pagina) params.registros_por_pagina = filtros.registros_por_pagina;
    
    return params;
  }
  
  /**
   * Formata os filtros de busca de pedidos para o formato esperado pela API
   * @param filtros Filtros de busca
   * @returns Filtros formatados
   */
  private formatarFiltrosPedido(filtros?: FiltroPedido): Record<string, any> {
    if (!filtros) {
      return {};
    }
    
    const params: Record<string, any> = {};
    
    if (filtros.id) params.id = filtros.id;
    if (filtros.numero) params.numero = filtros.numero;
    if (filtros.cliente_id) params.cliente_id = filtros.cliente_id;
    if (filtros.cliente_nome) params.cliente_nome = filtros.cliente_nome;
    if (filtros.data_inicial) params.data_inicial = filtros.data_inicial;
    if (filtros.data_final) params.data_final = filtros.data_final;
    if (filtros.situacao) params.situacao = filtros.situacao;
    if (filtros.pagina) params.pagina = filtros.pagina;
    if (filtros.registros_por_pagina) params.registros_por_pagina = filtros.registros_por_pagina;
    
    return params;
  }
  
  /**
   * Formata os filtros para API v3
   * @param filtros Filtros de busca
   * @returns Objeto com os parâmetros formatados para a API v3
   */
  private formatarFiltrosClienteV3(filtros?: FiltroCliente): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (!filtros) {
      return params;
    }
    
    if (filtros.id) {
      params.id = filtros.id;
    }
    
    if (filtros.nome) {
      params.name = filtros.nome;
    }
    
    if (filtros.cpf_cnpj) {
      params.cpf_cnpj = filtros.cpf_cnpj;
    }
    
    if (filtros.email) {
      params.email = filtros.email;
    }
    
    if (filtros.situacao) {
      params.status = filtros.situacao === 'A' ? 'active' : 'inactive';
    }
    
    if (filtros.pagina) {
      params.page = filtros.pagina;
    }
    
    if (filtros.registros_por_pagina) {
      params.per_page = filtros.registros_por_pagina;
    }
    
    return params;
  }
  
  /**
   * Busca produtos com os filtros informados
   * @param filtros Filtros de busca (opcional)
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de produtos
   */
  async listarProdutos(filtros?: Record<string, any>, forceRefresh: boolean = false): Promise<Produto[]> {
    const cacheKey = `produtos_${JSON.stringify(filtros || {})}`;
    
    // Verifica se há dados em cache
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<Produto[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    try {
      const params: Record<string, any> = filtros || {};
      
      const response = await this.httpClientV2.get<TinyApiResponse<{ produtos: Produto[] }>>(
        'produto.list.php', 
        { params }
      );
      
      if (response.data.status === 'Erro') {
        throw new Error(`Erro ao listar produtos: ${response.data.erro}`);
      }
      
      const produtos = response.data.retorno.produtos;
      
      // Armazena em cache
      if (this.useCache) {
        CacheService.setItem(cacheKey, produtos, this.cacheExpiration);
      }
      
      return produtos;
    } catch (error) {
      console.error('[TinyAPI] Erro ao listar produtos:', error);
      
      // Log detalhado para ajudar no diagnóstico
      if (axios.isAxiosError(error) && error.response) {
        console.error('[TinyAPI] Resposta do servidor:', error.response.data);
        console.error('[TinyAPI] Status code:', error.response.status);
      }
      
      throw error;
    }
  }

  /**
   * Testa a conexão com a API do Tiny
   * @returns true se a conexão for bem-sucedida, false caso contrário
   */
  async testConnection(): Promise<boolean> {
    try {
      // Tenta fazer uma requisição simples para verificar a conexão
      const response = await this.httpClientV2.get<TinyApiResponse<any>>(
        'contatos.pesquisa.php',
        { params: { registros_por_pagina: 1 } }
      );
      
      return response.data?.retorno?.status === 'OK';
    } catch (error) {
      console.error('[TinyAPI] Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Reinicializa o serviço com novas configurações
   * @param config Configurações parciais para atualizar
   */
  async reinitialize(config: Partial<TinyApiConfig>): Promise<void> {
    // Atualiza as propriedades com os novos valores (se fornecidos)
    if (config.token !== undefined) {
      this.token = config.token;
    }
    
    if (config.baseUrl !== undefined) {
      this.apiV2Url = config.baseUrl;
      // Atualiza o baseURL do cliente HTTP v2
      this.httpClientV2.defaults.baseURL = this.apiV2Url;
    }
    
    if (config.apiV3Url !== undefined) {
      this.apiV3Url = config.apiV3Url;
      // Atualiza o baseURL do cliente HTTP v3
      this.httpClientV3.defaults.baseURL = this.apiV3Url;
    }
    
    if (config.cache !== undefined) {
      this.useCache = config.cache;
    }
    
    if (config.cacheExpiration !== undefined) {
      this.cacheExpiration = config.cacheExpiration;
    }
    
    if (config.useOAuth !== undefined) {
      this.useOAuth = config.useOAuth;
    }
    
    // Se alterou valores relativos ao OAuth, recria o serviço de autenticação
    if (config.useOAuth !== undefined || config.clientId !== undefined || config.clientSecret !== undefined) {
      if (this.useOAuth) {
        const authConfig: TinyApiConfig = {
          token: this.token,
          baseUrl: this.apiV2Url,
          apiV3Url: this.apiV3Url,
          clientId: config.clientId || '',
          clientSecret: config.clientSecret || '',
          useOAuth: this.useOAuth
        };
        
        this.authService = new TinyAuthService(authConfig);
      } else {
        this.authService = null;
      }
    }
    
    console.log('[TinyAPI] Serviço reinicializado com sucesso');
  }

  /**
   * Busca detalhes completos de um pedido
   * @param pedidoId ID do pedido
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Dados detalhados do pedido
   */
  async getPedidoDetalhes(pedidoId: string, forceRefresh: boolean = false): Promise<PedidoDetalhado> {
    if (!pedidoId) {
      throw new Error('O parâmetro id deve ser informado');
    }
    
    const cacheKey = `pedido_detalhado_${pedidoId}`;
    
    // Verifica se há dados em cache
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<PedidoDetalhado>(cacheKey);
      if (cached) {
        console.log('[TinyAPI] Usando dados detalhados do pedido em cache');
        return cached;
      }
    }
    
    try {
      console.log(`[TinyAPI] Buscando detalhes completos do pedido ${pedidoId}`);
      
      // Os parâmetros devem seguir exatamente este formato para a API do Tiny
      const params = {
        token: this.token,
        formato: 'json',
        id: pedidoId
      };
      
      console.log('[TinyAPI] Parâmetros:', params);
      
      // Endpoint correto é pedido.obter.php (singular)
      const response = await this.httpClientV2.get(
        'pedido.obter.php', 
        { params }
      );
      
      console.log('[TinyAPI] Resposta do pedido.obter.php:', response.data);
      
      if (!response.data || !response.data.retorno) {
        throw new Error('Formato de resposta inválido da API Tiny');
      }
      
      if (response.data.retorno.status === 'Erro') {
        throw new Error(`Erro ao buscar pedido: ${response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido'}`);
      }
      
      // Extrai o pedido da resposta
      const raw = response.data.retorno.pedido;
      
      if (!raw) {
        throw new Error('Pedido não encontrado ou formato inválido');
      }
      
      console.log('[TinyAPI] Dados brutos do pedido:', JSON.stringify(raw));
      
      // Função helper para converter strings numéricas para números
      const parseNum = (v: any) => {
        if (v === undefined || v === null) return 0;
        if (typeof v === 'number') return v;
        // Remove qualquer formato monetário (R$, pontos, vírgulas) e converte para number
        const strValue = String(v).replace(/[^\d,-]/g, '').replace(',', '.');
        const parsed = Number(strValue);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Normaliza os itens do pedido
      let itensArray: any[] = [];
      
      // Tratamento especial para itens, verificando todas as estruturas possíveis
      if (raw.itens) {
        // Caso 1: itens.item é um array
        if (Array.isArray(raw.itens.item)) {
          itensArray = raw.itens.item;
        } 
        // Caso 2: itens.item é um objeto único
        else if (raw.itens.item && typeof raw.itens.item === 'object') {
          itensArray = [raw.itens.item];
        }
        // Caso 3: itens é um array
        else if (Array.isArray(raw.itens)) {
          itensArray = raw.itens;
        }
      } else if (raw.items_pedido?.item) {
        // Estrutura alternativa: items_pedido.item
        const items = raw.items_pedido.item;
        itensArray = Array.isArray(items) ? items : [items];
      }
      
      console.log(`[TinyAPI] Encontrados ${itensArray.length} itens no pedido:`, itensArray);
      
      // Extrai valores para logging - usar nomes corretos da documentação
      const valorProdutos = parseNum(raw.total_produtos || raw.valor_produtos || raw.valorProdutos || raw.produtos_valor || 0);
      const valorFrete = parseNum(raw.valor_frete || raw.valorFrete || raw.frete_valor || 0);
      const valorDesconto = parseNum(raw.valor_desconto || raw.valorDesconto || raw.desconto_valor || 0);
      const valorTotal = parseNum(raw.total_pedido || raw.valor_total || raw.valorTotal || raw.valor || 0);
      
      console.log(`[TinyAPI] Valores extraídos: produtos=${valorProdutos}, frete=${valorFrete}, desconto=${valorDesconto}, total=${valorTotal}`);
      
      // Log detalhado dos campos de valor encontrados
      console.log(`[TinyAPI] Campos de valor disponíveis no pedido:`, {
        total_produtos: raw.total_produtos,
        valor_produtos: raw.valor_produtos,
        valorProdutos: raw.valorProdutos,
        produtos_valor: raw.produtos_valor,
        valor_frete: raw.valor_frete,
        valorFrete: raw.valorFrete,
        frete_valor: raw.frete_valor,
        valor_desconto: raw.valor_desconto,
        valorDesconto: raw.valorDesconto,
        desconto_valor: raw.desconto_valor,
        total_pedido: raw.total_pedido,
        valor_total: raw.valor_total,
        valorTotal: raw.valorTotal,
        valor: raw.valor
      });
      
      // Monta o objeto PedidoDetalhado normalizado
      const pedidoDetalhado: PedidoDetalhado = {
        id: raw.id?.toString() || '',
        numero: raw.numero?.toString() || raw.numeroPedido?.toString() || '',
        numero_ecommerce: raw.numero_ecommerce?.toString() || raw.numeroEcommerce?.toString() || '',
        data_pedido: raw.data_pedido || raw.dataPedido || '',
        data_criacao: raw.data_criacao || raw.dataCriacao || raw.data || '',
        ultima_atualizacao: raw.data_alteracao || raw.dataAlteracao || raw.data_atualizacao || raw.dataAtualizacao || '',
        nome_cliente: raw.nome_cliente || raw.nomeCliente || raw.nome || raw.cliente?.nome || '-',
        cpf_cnpj_cliente: raw.cpf_cnpj || raw.cpfCnpj || raw.cliente?.cpf_cnpj || '',
        valor_produtos: valorProdutos,
        valor_frete: valorFrete,
        valor_desconto: valorDesconto,
        valor_total: valorTotal,
        situacao: raw.situacao || raw.status || 'desconhecido',
        forma_pagamento: raw.forma_pagamento || raw.formaPagamento || '',
        forma_frete: raw.forma_frete || raw.formaFrete || raw.tipo_frete || '',
        observacoes: raw.observacoes || raw.observacao || raw.obs || '',
        itens: itensArray.map((it: any) => {
          const valorUnitario = parseNum(it.valor_unitario || it.valorUnitario || it.preco_unitario || it.precoUnitario || 0);
          const quantidade = parseNum(it.quantidade || it.qtde || 0);
          const valorTotal = parseNum(it.valor_total || it.valorTotal || it.valor || (quantidade * valorUnitario) || 0);
          
          return {
            id: it.id?.toString() || it.item_id?.toString() || '',
            codigo: it.codigo?.toString() || it.codigo_produto?.toString() || '',
            descricao: it.descricao || it.descricao_produto || it.nome || '',
            unidade: it.unidade || it.un || 'UN',
            quantidade: quantidade,
            valor_unitario: valorUnitario,
            valor_total: valorTotal
          };
        })
      };
      
      console.log(`[TinyAPI] Pedido ${pedidoId} processado:`, pedidoDetalhado);
      
      // Armazena em cache
      if (this.useCache) {
        CacheService.setItem(cacheKey, pedidoDetalhado, this.cacheExpiration);
      }
      
      return pedidoDetalhado;
    } catch (error) {
      console.error(`[TinyAPI] Erro ao buscar detalhes do pedido ${pedidoId}:`, error);
      throw error;
    }
  }

  /**
   * Busca notas fiscais com os filtros informados
   * @param filtros Filtros de busca de notas fiscais
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de notas fiscais
   */
  async getNotasFiscais(
    filtros?: FiltroNotaFiscal,
    forceRefresh = false
  ): Promise<NotaFiscal[]> {
    const cacheKey = `notas_fiscais_${JSON.stringify(filtros || {})}`;
    
    console.log(`🔍 [TinyAPI] Buscando notas fiscais com filtros:`, filtros);
    
    // Verifica cache se habilitado e não forçar refresh
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<NotaFiscal[]>(cacheKey);
      if (cached) {
        console.log('📦 [TinyAPI] Usando notas fiscais em cache');
        return cached;
      }
    }

    try {
      const parametros = this.formatarFiltrosNotaFiscal(filtros);
      console.log(`📤 [TinyAPI] Parâmetros da requisição de NF:`, parametros);

      const resp = await this.httpClientV2.get(
        'notas.fiscais.pesquisa.php',
        { params: parametros }
      );
      
      console.log(`📥 [TinyAPI] Resposta bruta da API de NF:`, resp.data);
      
      const r = resp.data.retorno;
      if (r.status === 'Erro') {
        const erro = r.erros?.[0]?.erro || 'Erro ao buscar notas fiscais';
        console.error(`❌ [TinyAPI] Erro da API de NF:`, erro);
        throw new Error(erro);
      }

      // Extrai notas fiscais da resposta
      let rawNotasFiscais: any[] = [];
      if (Array.isArray(r.notas_fiscais)) {
        rawNotasFiscais = r.notas_fiscais.map((x: any) => x.nota_fiscal);
        console.log(`📋 [TinyAPI] Formato de NF detectado: ${rawNotasFiscais.length} notas`);
      } else if (r.notas_fiscais?.nota_fiscal) {
        const nf = r.notas_fiscais.nota_fiscal;
        rawNotasFiscais = Array.isArray(nf) ? nf : [nf];
        console.log(`📋 [TinyAPI] Formato legado de NF detectado: ${rawNotasFiscais.length} notas`);
      } else {
        console.log('📋 [TinyAPI] Nenhuma nota fiscal encontrada');
        rawNotasFiscais = [];
      }

      const notasFiscaisNormalizadas = this.normalizarNotasFiscais(rawNotasFiscais);
      
      // Armazena em cache se habilitado
      if (this.useCache) {
        CacheService.setItem(cacheKey, notasFiscaisNormalizadas, this.cacheExpiration);
      }
      
      console.log(`✅ [TinyAPI] Retornando ${notasFiscaisNormalizadas.length} notas fiscais`);
      return notasFiscaisNormalizadas;
      
    } catch (error) {
      console.error('❌ [TinyAPI] Erro ao buscar notas fiscais:', error);
      throw error;
    }
  }

  /**
   * Busca notas fiscais de um cliente específico
   * @param clienteId ID do cliente ou CPF/CNPJ
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de notas fiscais do cliente
   */
  async getNotasFiscaisPorCliente(
    clienteId: string,
    forceRefresh = false
  ): Promise<NotaFiscal[]> {
    console.log(`🔍 [TinyAPI] Buscando notas fiscais do cliente: ${clienteId}`);
    
    // Determina se é CPF/CNPJ ou nome do cliente
    const isDocument = /^[\d.,/-]+$/.test(clienteId.replace(/\s/g, ''));
    
    const filtros: FiltroNotaFiscal = isDocument 
      ? { cpf_cnpj: clienteId.replace(/[^\d]/g, '') } // Remove formatação de CPF/CNPJ
      : { cliente: clienteId };
    
    return this.getNotasFiscais(filtros, forceRefresh);
  }

  /**
   * Formatar filtros para pesquisa de notas fiscais
   * @param filtros Filtros de entrada
   * @returns Parâmetros formatados para a API
   */
  private formatarFiltrosNotaFiscal(filtros?: FiltroNotaFiscal): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (!filtros) return params;
    
    // Mapeamento dos filtros conforme documentação da API
    if (filtros.tipoNota) params.tipoNota = filtros.tipoNota;
    if (filtros.numero) params.numero = filtros.numero;
    if (filtros.cliente) params.cliente = filtros.cliente;
    if (filtros.cpf_cnpj) params.cpf_cnpj = filtros.cpf_cnpj;
    if (filtros.dataInicial) params.dataInicial = filtros.dataInicial;
    if (filtros.dataFinal) params.dataFinal = filtros.dataFinal;
    if (filtros.situacao) params.situacao = filtros.situacao;
    if (filtros.numeroEcommerce) params.numeroEcommerce = filtros.numeroEcommerce;
    if (filtros.idVendedor) params.idVendedor = filtros.idVendedor;
    if (filtros.idFormaEnvio) params.idFormaEnvio = filtros.idFormaEnvio;
    if (filtros.nomeVendedor) params.nomeVendedor = filtros.nomeVendedor;
    if (filtros.pagina) params.pagina = filtros.pagina;
    
    return params;
  }

  /**
   * Normaliza dados brutos de notas fiscais da API
   * @param rawNotasFiscais Dados brutos da API
   * @returns Lista de notas fiscais normalizadas
   */
  private normalizarNotasFiscais(rawNotasFiscais: any[]): NotaFiscal[] {
    return rawNotasFiscais.map((raw: any): NotaFiscal => {
      // Função helper para converter valores monetários
      const parseValor = (val: any): number => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        
        console.log(`[TinyAPI] parseValor (NF) recebeu:`, { valor: val, tipo: typeof val });
        
        // Converter para string primeiro
        let strVal = String(val).trim();
        
        // Se a string está vazia após limpeza, retorna 0
        if (!strVal) return 0;
        
        // Remover símbolos monetários e espaços
        strVal = strVal.replace(/[R$\s]/g, '');
        
        // NOVA LÓGICA: A API do Tiny retorna valores em centavos
        // Exemplo: "78840" = R$ 788,40 (não R$ 78.840,00)
        
        // Se contém apenas dígitos (formato da API em centavos)
        if (/^\d+$/.test(strVal)) {
          const resultado = parseInt(strVal, 10) / 100; // Dividir por 100 para converter centavos
          console.log(`[TinyAPI] parseValor (NF centavos) converteu "${val}" -> ${resultado}`);
          return resultado;
        }
        
        // Padrão 1: Formato com vírgula decimal brasileira (1.234,56)
        if (strVal.includes(',')) {
          // Remove pontos (separadores de milhares) e converte vírgula para ponto
          strVal = strVal.replace(/\./g, '').replace(',', '.');
          const resultado = parseFloat(strVal);
          const final = isNaN(resultado) ? 0 : resultado;
          console.log(`[TinyAPI] parseValor (NF formato brasileiro) converteu "${val}" -> "${strVal}" -> ${final}`);
          return final;
        }
        
        // Padrão 2: Formato americano com ponto decimal (1234.56)
        if (/^\d+\.\d{1,2}$/.test(strVal)) {
          const resultado = parseFloat(strVal);
          console.log(`[TinyAPI] parseValor (NF formato americano) converteu "${val}" -> ${resultado}`);
          return resultado;
        }
        
        // Padrão 3: Formato com separadores de milhares sem decimais (1.234)
        if (/^\d{1,3}(\.\d{3})+$/.test(strVal)) {
          // Assumir que são separadores de milhares, não decimais
          const valorSemPontos = strVal.replace(/\./g, '');
          const resultado = parseInt(valorSemPontos, 10) / 100; // Tratar como centavos
          console.log(`[TinyAPI] parseValor (NF milhares como centavos) converteu "${val}" -> "${valorSemPontos}" -> ${resultado}`);
          return resultado;
        }
        
        // Fallback: tenta parseFloat direto
        const num = parseFloat(strVal);
        const resultado = isNaN(num) ? 0 : num;
        console.log(`[TinyAPI] parseValor (NF fallback) converteu "${val}" -> "${strVal}" -> ${resultado}`);
        return resultado;
      };

      return {
        id: raw.id?.toString() || '',
        tipo: raw.tipo || 'S',
        numero: raw.numero?.toString() || '',
        serie: raw.serie?.toString() || '',
        data_emissao: raw.data_emissao || '',
        data_saida_entrada: raw.data_saida_entrada || '',
        numero_ecommerce: raw.numero_ecommerce?.toString() || '',
        cliente_id: raw.cliente_id?.toString() || '',
        cliente_nome: raw.cliente_nome || '',
        cliente_tipo_pessoa: raw.cliente_tipo_pessoa || '',
        cliente_cpf_cnpj: raw.cliente_cpf_cnpj || '',
        cliente_endereco: raw.cliente_endereco || '',
        cliente_numero: raw.cliente_numero || '',
        cliente_complemento: raw.cliente_complemento || '',
        cliente_bairro: raw.cliente_bairro || '',
        cliente_cep: raw.cliente_cep || '',
        cliente_cidade: raw.cliente_cidade || '',
        cliente_uf: raw.cliente_uf || '',
        cliente_fone: raw.cliente_fone || '',
        cliente_email: raw.cliente_email || '',
        endereco_entrega: raw.endereco_entrega ? {
          tipo_pessoa: raw.endereco_entrega.tipo_pessoa || '',
          cpf_cnpj: raw.endereco_entrega.cpf_cnpj || '',
          endereco: raw.endereco_entrega.endereco || '',
          numero: raw.endereco_entrega.numero || '',
          complemento: raw.endereco_entrega.complemento || '',
          bairro: raw.endereco_entrega.bairro || '',
          cep: raw.endereco_entrega.cep || '',
          cidade: raw.endereco_entrega.cidade || '',
          uf: raw.endereco_entrega.uf || '',
          fone: raw.endereco_entrega.fone || '',
          nome_destinatario: raw.endereco_entrega.nome_destinatario || ''
        } : undefined,
        transportador: raw.transportador ? {
          nome: raw.transportador.nome || ''
        } : undefined,
        valor: parseValor(raw.valor),
        valor_produtos: parseValor(raw.valor_produtos),
        valor_frete: parseValor(raw.valor_frete),
        id_vendedor: raw.id_vendedor ? Number(raw.id_vendedor) : undefined,
        nome_vendedor: raw.nome_vendedor || '',
        situacao: Number(raw.situacao) || 0,
        descricao_situacao: raw.descricao_situacao || '',
        chave_acesso: raw.chave_acesso || '',
        id_forma_frete: raw.id_forma_frete || '',
        id_forma_envio: raw.id_forma_envio || '',
        codigo_rastreamento: raw.codigo_rastreamento || '',
        url_rastreamento: raw.url_rastreamento || ''
      };
    });
  }

  // ============================================
  // MÉTODOS FINANCEIROS - CONTAS A PAGAR
  // ============================================

  /**
   * Busca contas a pagar com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de contas a pagar
   */
  async getContasPagar(
    filtros?: FiltroContaPagar,
    forceRefresh = false
  ): Promise<ContaPagar[]> {
    const cacheKey = `contas_pagar_${JSON.stringify(filtros || {})}`;
    
    console.log(`💰 [TinyAPI] Buscando contas a pagar com filtros:`, filtros);
    
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<ContaPagar[]>(cacheKey);
      if (cached) {
        console.log('📦 [TinyAPI] Usando contas a pagar em cache');
        return cached;
      }
    }

    try {
      const parametros = this.formatarFiltrosContaPagar(filtros);
      console.log(`📤 [TinyAPI] Parâmetros da requisição de contas a pagar:`, parametros);

      const resp = await this.httpClientV2.get(
        'contas.pagar.pesquisa.php',
        { params: parametros }
      );
      
      console.log(`📥 [TinyAPI] Resposta bruta da API de contas a pagar:`, resp.data);
      
      const r = resp.data.retorno;
      if (r.status === 'Erro') {
        const erro = r.erros?.[0]?.erro || 'Erro ao buscar contas a pagar';
        console.error(`❌ [TinyAPI] Erro da API:`, erro);
        throw new Error(erro);
      }

      let rawContas: any[] = [];
      if (Array.isArray(r.contas)) {
        rawContas = r.contas.map((x: any) => x.conta);
      } else if (r.contas?.conta) {
        const c = r.contas.conta;
        rawContas = Array.isArray(c) ? c : [c];
      }

      const contasNormalizadas = this.normalizarContasPagar(rawContas);
      
      if (this.useCache && !forceRefresh) {
        CacheService.setItem(cacheKey, contasNormalizadas, this.cacheExpiration);
      }
      
      console.log(`✅ [TinyAPI] ${contasNormalizadas.length} contas a pagar processadas`);
      return contasNormalizadas;
      
    } catch (error) {
      console.error('❌ [TinyAPI] Erro ao buscar contas a pagar:', error);
      throw error;
    }
  }

  /**
   * Formatar filtros para pesquisa de contas a pagar
   */
  private formatarFiltrosContaPagar(filtros?: FiltroContaPagar): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (!filtros) return params;
    
    if (filtros.dataInicial) params.dataInicial = filtros.dataInicial;
    if (filtros.dataFinal) params.dataFinal = filtros.dataFinal;
    if (filtros.dataVencimentoInicial) params.dataVencimentoInicial = filtros.dataVencimentoInicial;
    if (filtros.dataVencimentoFinal) params.dataVencimentoFinal = filtros.dataVencimentoFinal;
    if (filtros.situacao) params.situacao = filtros.situacao;
    if (filtros.fornecedor) params.fornecedor = filtros.fornecedor;
    if (filtros.numero) params.numero = filtros.numero;
    if (filtros.pagina) params.pagina = filtros.pagina;
    
    return params;
  }

  /**
   * Normaliza dados brutos de contas a pagar
   */
  private normalizarContasPagar(rawContas: any[]): ContaPagar[] {
    const parseValor = this.createParseValor('ContaPagar');
    
    return rawContas.map((raw: any): ContaPagar => ({
      id: raw.id?.toString() || '',
      numero_documento: raw.numero_doc || raw.numero_documento || raw.numero || '',
      data_emissao: raw.data_emissao || raw.dataEmissao || '',
      data_vencimento: raw.data_vencimento || raw.dataVencimento || raw.vencimento || '',
      data_pagamento: raw.data_pagamento || raw.dataPagamento || undefined,
      valor: parseValor(raw.valor),
      valor_pago: parseValor(raw.valor_pago || raw.valorPago || 0),
      saldo: parseValor(raw.saldo || (raw.valor - (raw.valor_pago || 0))),
      situacao: raw.situacao || 'aberto',
      fornecedor: {
        id: raw.id_fornecedor?.toString() || raw.fornecedor_id?.toString() || '',
        nome: raw.nome_fornecedor || raw.fornecedor || '',
        cpf_cnpj: raw.cpf_cnpj_fornecedor || ''
      },
      categoria: raw.categoria || raw.nome_categoria || '',
      conta_bancaria: raw.conta_bancaria || raw.nome_conta || '',
      forma_pagamento: raw.forma_pagamento || raw.formaPagamento || '',
      observacoes: raw.observacoes || raw.obs || '',
      historico: raw.historico || ''
    }));
  }

  // ============================================
  // MÉTODOS FINANCEIROS - CONTAS A RECEBER
  // ============================================

  /**
   * Busca contas a receber com os filtros informados
   * @param filtros Filtros de busca
   * @param forceRefresh Forçar atualização ignorando cache
   * @returns Lista de contas a receber
   */
  async getContasReceber(
    filtros?: FiltroContaReceber,
    forceRefresh = false
  ): Promise<ContaReceber[]> {
    const cacheKey = `contas_receber_${JSON.stringify(filtros || {})}`;
    
    console.log(`💵 [TinyAPI] Buscando contas a receber com filtros:`, filtros);
    
    if (this.useCache && !forceRefresh) {
      const cached = CacheService.getItem<ContaReceber[]>(cacheKey);
      if (cached) {
        console.log('📦 [TinyAPI] Usando contas a receber em cache');
        return cached;
      }
    }

    try {
      const parametros = this.formatarFiltrosContaReceber(filtros);
      console.log(`📤 [TinyAPI] Parâmetros da requisição de contas a receber:`, parametros);

      const resp = await this.httpClientV2.get(
        'contas.receber.pesquisa.php',
        { params: parametros }
      );
      
      console.log(`📥 [TinyAPI] Resposta bruta da API de contas a receber:`, resp.data);
      
      const r = resp.data.retorno;
      if (r.status === 'Erro') {
        const erro = r.erros?.[0]?.erro || 'Erro ao buscar contas a receber';
        console.error(`❌ [TinyAPI] Erro da API:`, erro);
        throw new Error(erro);
      }

      let rawContas: any[] = [];
      if (Array.isArray(r.contas)) {
        rawContas = r.contas.map((x: any) => x.conta);
      } else if (r.contas?.conta) {
        const c = r.contas.conta;
        rawContas = Array.isArray(c) ? c : [c];
      }

      const contasNormalizadas = this.normalizarContasReceber(rawContas);
      
      if (this.useCache && !forceRefresh) {
        CacheService.setItem(cacheKey, contasNormalizadas, this.cacheExpiration);
      }
      
      console.log(`✅ [TinyAPI] ${contasNormalizadas.length} contas a receber processadas`);
      return contasNormalizadas;
      
    } catch (error) {
      console.error('❌ [TinyAPI] Erro ao buscar contas a receber:', error);
      throw error;
    }
  }

  /**
   * Formatar filtros para pesquisa de contas a receber
   */
  private formatarFiltrosContaReceber(filtros?: FiltroContaReceber): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (!filtros) return params;
    
    if (filtros.dataInicial) params.dataInicial = filtros.dataInicial;
    if (filtros.dataFinal) params.dataFinal = filtros.dataFinal;
    if (filtros.dataVencimentoInicial) params.dataVencimentoInicial = filtros.dataVencimentoInicial;
    if (filtros.dataVencimentoFinal) params.dataVencimentoFinal = filtros.dataVencimentoFinal;
    if (filtros.situacao) params.situacao = filtros.situacao;
    if (filtros.cliente) params.cliente = filtros.cliente;
    if (filtros.numero) params.numero = filtros.numero;
    if (filtros.pagina) params.pagina = filtros.pagina;
    
    return params;
  }

  /**
   * Normaliza dados brutos de contas a receber
   */
  private normalizarContasReceber(rawContas: any[]): ContaReceber[] {
    const parseValor = this.createParseValor('ContaReceber');
    
    return rawContas.map((raw: any): ContaReceber => ({
      id: raw.id?.toString() || '',
      numero_documento: raw.numero_doc || raw.numero_documento || raw.numero || '',
      data_emissao: raw.data_emissao || raw.dataEmissao || '',
      data_vencimento: raw.data_vencimento || raw.dataVencimento || raw.vencimento || '',
      data_recebimento: raw.data_recebimento || raw.dataRecebimento || undefined,
      valor: parseValor(raw.valor),
      valor_recebido: parseValor(raw.valor_recebido || raw.valorRecebido || 0),
      saldo: parseValor(raw.saldo || (raw.valor - (raw.valor_recebido || 0))),
      situacao: raw.situacao || 'aberto',
      cliente: {
        id: raw.id_cliente?.toString() || raw.cliente_id?.toString() || '',
        nome: raw.nome_cliente || raw.cliente || '',
        cpf_cnpj: raw.cpf_cnpj_cliente || ''
      },
      categoria: raw.categoria || raw.nome_categoria || '',
      conta_bancaria: raw.conta_bancaria || raw.nome_conta || '',
      forma_recebimento: raw.forma_recebimento || raw.formaRecebimento || '',
      observacoes: raw.observacoes || raw.obs || '',
      historico: raw.historico || '',
      numero_pedido: raw.numero_pedido || raw.numeroPedido || '',
      numero_nf: raw.numero_nf || raw.numeroNf || ''
    }));
  }

  // ============================================
  // MÉTODOS FINANCEIROS - RESUMO
  // ============================================

  /**
   * Obtém resumo financeiro do período
   * @param dataInicial Data inicial do período (dd/mm/yyyy)
   * @param dataFinal Data final do período (dd/mm/yyyy)
   * @returns Resumo financeiro consolidado
   */
  async getResumoFinanceiro(
    dataInicial: string,
    dataFinal: string
  ): Promise<ResumoFinanceiro> {
    console.log(`📊 [TinyAPI] Gerando resumo financeiro de ${dataInicial} a ${dataFinal}`);
    
    try {
      // Buscar contas a pagar e receber em paralelo
      const [contasPagar, contasReceber] = await Promise.all([
        this.getContasPagar({ dataInicial, dataFinal }, true),
        this.getContasReceber({ dataInicial, dataFinal }, true)
      ]);

      // Calcular totais de contas a pagar
      const totalPagar = contasPagar.reduce((acc, c) => acc + c.valor, 0);
      const pagoPagar = contasPagar.reduce((acc, c) => acc + c.valor_pago, 0);
      const pendentePagar = contasPagar
        .filter(c => c.situacao !== 'pago' && c.situacao !== 'cancelado')
        .reduce((acc, c) => acc + c.saldo, 0);
      const vencidoPagar = contasPagar
        .filter(c => {
          if (c.situacao === 'pago' || c.situacao === 'cancelado') return false;
          const venc = this.parseDataBR(c.data_vencimento);
          return venc && venc < new Date();
        })
        .reduce((acc, c) => acc + c.saldo, 0);

      // Calcular totais de contas a receber
      const totalReceber = contasReceber.reduce((acc, c) => acc + c.valor, 0);
      const recebidoReceber = contasReceber.reduce((acc, c) => acc + c.valor_recebido, 0);
      const pendenteReceber = contasReceber
        .filter(c => c.situacao !== 'pago' && c.situacao !== 'cancelado')
        .reduce((acc, c) => acc + c.saldo, 0);
      const vencidoReceber = contasReceber
        .filter(c => {
          if (c.situacao === 'pago' || c.situacao === 'cancelado') return false;
          const venc = this.parseDataBR(c.data_vencimento);
          return venc && venc < new Date();
        })
        .reduce((acc, c) => acc + c.saldo, 0);

      const resumo: ResumoFinanceiro = {
        periodo: {
          inicio: dataInicial,
          fim: dataFinal
        },
        contas_pagar: {
          total: totalPagar,
          pago: pagoPagar,
          pendente: pendentePagar,
          vencido: vencidoPagar,
          quantidade: contasPagar.length
        },
        contas_receber: {
          total: totalReceber,
          recebido: recebidoReceber,
          pendente: pendenteReceber,
          vencido: vencidoReceber,
          quantidade: contasReceber.length
        },
        saldo: pendenteReceber - pendentePagar,
        fluxo_caixa: {
          entradas: recebidoReceber,
          saidas: pagoPagar,
          saldo: recebidoReceber - pagoPagar
        }
      };

      console.log(`✅ [TinyAPI] Resumo financeiro gerado:`, resumo);
      return resumo;
      
    } catch (error) {
      console.error('❌ [TinyAPI] Erro ao gerar resumo financeiro:', error);
      throw error;
    }
  }

  /**
   * Converte data no formato brasileiro (dd/mm/yyyy) para Date
   */
  private parseDataBR(dataStr: string): Date | null {
    if (!dataStr) return null;
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes.map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Cria função parseValor com contexto para logs
   */
  private createParseValor(contexto: string) {
    return (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      
      let strVal = String(val).trim();
      if (!strVal) return 0;
      
      strVal = strVal.replace(/[R$\s]/g, '');
      
      // Se contém apenas dígitos (formato em centavos)
      if (/^\d+$/.test(strVal)) {
        return parseInt(strVal, 10) / 100;
      }
      
      // Formato brasileiro (1.234,56)
      if (strVal.includes(',')) {
        strVal = strVal.replace(/\./g, '').replace(',', '.');
        const resultado = parseFloat(strVal);
        return isNaN(resultado) ? 0 : resultado;
      }
      
      // Formato americano (1234.56)
      if (/^\d+\.\d{1,2}$/.test(strVal)) {
        return parseFloat(strVal);
      }
      
      const num = parseFloat(strVal);
      return isNaN(num) ? 0 : num;
    };
  }
} 