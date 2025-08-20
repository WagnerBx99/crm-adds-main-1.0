/**
 * Configuração de Content Security Policy (CSP)
 * 
 * Este módulo define políticas de segurança para proteger a aplicação contra
 * ataques XSS, clickjacking, injeção de código e outros ataques comuns.
 */

interface CspDirective {
  [key: string]: string[];
}

export class ContentSecurityPolicy {
  private directives: CspDirective = {};
  private reportOnly: boolean = false;
  private reportUri: string = '';
  
  constructor() {
    // Configuração padrão segura
    this.directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"] // Proteção contra clickjacking
    };
  }
  
  /**
   * Adicionar origem a uma diretiva específica
   * @param directive Nome da diretiva (ex: script-src)
   * @param source Origem a ser adicionada
   */
  public addSource(directive: string, source: string): ContentSecurityPolicy {
    if (!this.directives[directive]) {
      this.directives[directive] = [];
    }
    
    if (!this.directives[directive].includes(source)) {
      this.directives[directive].push(source);
    }
    
    return this;
  }
  
  /**
   * Adicionar múltiplas origens a uma diretiva
   * @param directive Nome da diretiva
   * @param sources Lista de origens
   */
  public addSources(directive: string, sources: string[]): ContentSecurityPolicy {
    sources.forEach(source => this.addSource(directive, source));
    return this;
  }
  
  /**
   * Permitir inline scripts (não recomendado em produção)
   */
  public allowInlineScripts(): ContentSecurityPolicy {
    return this.addSource('script-src', "'unsafe-inline'");
  }
  
  /**
   * Permitir eval() e construções similares (não recomendado em produção)
   */
  public allowEval(): ContentSecurityPolicy {
    return this.addSource('script-src', "'unsafe-eval'");
  }
  
  /**
   * Permitir inline styles
   */
  public allowInlineStyles(): ContentSecurityPolicy {
    return this.addSource('style-src', "'unsafe-inline'");
  }
  
  /**
   * Permitir websockets
   * @param host Hostname do servidor websocket
   */
  public allowWebSockets(host: string): ContentSecurityPolicy {
    return this.addSource('connect-src', `wss://${host}`);
  }
  
  /**
   * Permitir origens de APIs externas
   * @param hosts Lista de hostnames
   */
  public allowApis(hosts: string[]): ContentSecurityPolicy {
    return this.addSources('connect-src', hosts.map(host => `https://${host}`));
  }
  
  /**
   * Permitir CDNs comuns para scripts
   */
  public allowCommonCdns(): ContentSecurityPolicy {
    return this.addSources('script-src', [
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://cdnjs.cloudflare.com'
    ]);
  }
  
  /**
   * Configurar modo somente relatório (não bloqueia, apenas reporta violações)
   * @param reportUri URI para onde enviar relatórios de violação
   */
  public enableReportOnly(reportUri: string): ContentSecurityPolicy {
    this.reportOnly = true;
    this.reportUri = reportUri;
    return this;
  }
  
  /**
   * Gerar o header CSP
   */
  public getHeader(): { name: string, value: string } {
    const parts: string[] = [];
    
    // Adicionar todas as diretivas
    for (const [directive, sources] of Object.entries(this.directives)) {
      if (sources.length > 0) {
        parts.push(`${directive} ${sources.join(' ')}`);
      }
    }
    
    // Adicionar URI de relatório se configurado
    if (this.reportUri) {
      parts.push(`report-uri ${this.reportUri}`);
    }
    
    const headerName = this.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    
    return {
      name: headerName,
      value: parts.join('; ')
    };
  }
  
  /**
   * Aplicar política a um objeto de headers
   * @param headers Objeto de headers
   */
  public applyToHeaders(headers: Record<string, string>): Record<string, string> {
    const { name, value } = this.getHeader();
    return {
      ...headers,
      [name]: value
    };
  }
}

// Configuração padrão para desenvolvimento
export const devCsp = new ContentSecurityPolicy()
  .allowInlineScripts()
  .allowInlineStyles()
  .allowEval()
  .addSource('connect-src', 'http://localhost:*');

// Configuração mais segura para produção
export const prodCsp = new ContentSecurityPolicy()
  .allowInlineStyles() // Muitas bibliotecas de UI precisam disso
  .addSources('img-src', ['https://storage.googleapis.com', 'https://*.amazonaws.com'])
  .allowApis(['api.exemplo.com']); 