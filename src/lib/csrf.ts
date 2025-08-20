import { v4 as uuidv4 } from 'uuid';

/**
 * Módulo para gerenciamento de proteção CSRF (Cross-Site Request Forgery)
 * 
 * Implementa o padrão de token duplo:
 * 1. Um token é armazenado em cookie HttpOnly
 * 2. O mesmo token é enviado nas requisições em um cabeçalho
 * 3. O servidor verifica se os dois tokens correspondem
 */
class CsrfProtection {
  private readonly TOKEN_KEY = 'csrf_token';
  private readonly HEADER_NAME = 'X-CSRF-Token';
  private readonly TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 horas
  private readonly ALLOWED_ORIGINS: string[] = [
    'http://localhost:8081',      // Desenvolvimento
    'http://localhost:8080',      // Desenvolvimento alternativo
    'https://crm-adds.exemplo.com' // Produção (exemplo)
  ];
  private readonly MAX_TOKENS = 10; // Máximo de tokens ativos simultâneos
  private tokens: Map<string, number> = new Map(); // Map de tokens ativos e seus tempos de expiração
  
  constructor() {
    this.loadTokensFromStorage();
  }
  
  // Carregar tokens do armazenamento
  private loadTokensFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem('csrf_tokens');
      if (storedTokens) {
        const tokenData = JSON.parse(storedTokens);
        this.tokens = new Map(Object.entries(tokenData));
        
        // Limpar tokens expirados
        this.cleanupExpiredTokens();
      }
    } catch (error) {
      console.error('Erro ao carregar tokens CSRF:', error);
      this.tokens = new Map();
    }
  }
  
  // Salvar tokens no armazenamento
  private saveTokensToStorage(): void {
    try {
      const tokenData = Object.fromEntries(this.tokens);
      localStorage.setItem('csrf_tokens', JSON.stringify(tokenData));
    } catch (error) {
      console.error('Erro ao salvar tokens CSRF:', error);
    }
  }
  
  // Limpar tokens expirados
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let hasExpired = false;
    
    // Remover tokens expirados
    for (const [token, expiresAt] of this.tokens.entries()) {
      if (expiresAt < now) {
        this.tokens.delete(token);
        hasExpired = true;
      }
    }
    
    // Se algum token foi removido, salvar alterações
    if (hasExpired) {
      this.saveTokensToStorage();
    }
  }
  
  // Gerar novo token CSRF
  public generateToken(): string {
    // Limpar tokens expirados antes de gerar um novo
    this.cleanupExpiredTokens();
    
    const token = uuidv4();
    const expiresAt = Date.now() + this.TOKEN_EXPIRY;
    
    // Adicionar novo token à lista
    this.tokens.set(token, expiresAt);
    
    // Se exceder o limite de tokens, remover o mais antigo
    if (this.tokens.size > this.MAX_TOKENS) {
      const oldestToken = Array.from(this.tokens.keys())[0];
      this.tokens.delete(oldestToken);
    }
    
    // Salvar alterações
    this.saveTokensToStorage();
    
    // Armazenar o token atual no localStorage (em produção seria um cookie HttpOnly)
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify({
      token,
      expiresAt
    }));
    
    return token;
  }
  
  // Obter o token atual ou gerar um novo se não existir ou estiver expirado
  public getToken(): string {
    const storedData = localStorage.getItem(this.TOKEN_KEY);
    
    if (storedData) {
      try {
        const { token, expiresAt } = JSON.parse(storedData);
        
        // Verificar se o token expirou
        if (expiresAt > Date.now()) {
          return token;
        }
      } catch (error) {
        console.error('Erro ao processar token CSRF:', error);
      }
    }
    
    // Se não existir ou estiver expirado, gerar novo
    return this.generateToken();
  }
  
  // Verificar se o token recebido é válido
  public verifyToken(receivedToken: string): boolean {
    // Se o token não existir na lista, é inválido
    if (!this.tokens.has(receivedToken)) {
      return false;
    }
    
    // Verificar se expirou
    const expiresAt = this.tokens.get(receivedToken);
    if (expiresAt && expiresAt < Date.now()) {
      this.tokens.delete(receivedToken);
      this.saveTokensToStorage();
      return false;
    }
    
    return true;
  }
  
  // Verificar se o token recebido corresponde ao armazenado
  public verifyCurrentToken(receivedToken: string): boolean {
    const currentToken = this.getToken();
    return currentToken === receivedToken && this.verifyToken(receivedToken);
  }
  
  // Validar se a origem da requisição é permitida
  public validateOrigin(origin: string | null): boolean {
    if (!origin) return false;
    
    // Em ambiente de desenvolvimento, aceitar localhost independente da porta
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return true;
    }
    
    return this.ALLOWED_ORIGINS.includes(origin);
  }
  
  // Verificar cabeçalho Referer
  public validateReferer(referer: string | null): boolean {
    if (!referer) return false;
    
    // Verificar se o referer começa com uma origem permitida
    return this.ALLOWED_ORIGINS.some(origin => referer.startsWith(origin));
  }
  
  // Obter o nome do cabeçalho para envio do token
  public getHeaderName(): string {
    return this.HEADER_NAME;
  }
  
  // Adicionar token ao cabeçalho de uma requisição
  public addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      [this.HEADER_NAME]: this.getToken()
    };
  }
  
  // Gerar HTML para incluir o token CSRF em um formulário
  public generateFormField(): string {
    const token = this.getToken();
    return `<input type="hidden" name="${this.HEADER_NAME}" value="${token}" />`;
  }
  
  // Obter token para uso em formulários React
  public getFormToken(): { name: string, value: string } {
    return {
      name: this.HEADER_NAME,
      value: this.getToken()
    };
  }
  
  // Limpar tokens
  public clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokens.clear();
    this.saveTokensToStorage();
  }
  
  // Invalidar um token específico após uso (para implementação de token de uso único)
  public invalidateToken(token: string): void {
    this.tokens.delete(token);
    this.saveTokensToStorage();
    
    // Se for o token atual, gerar um novo
    const currentData = localStorage.getItem(this.TOKEN_KEY);
    if (currentData) {
      try {
        const { token: currentToken } = JSON.parse(currentData);
        if (currentToken === token) {
          this.generateToken();
        }
      } catch (error) {
        console.error('Erro ao invalidar token atual:', error);
      }
    }
  }
}

// Exportar instância única
export const csrfProtection = new CsrfProtection(); 