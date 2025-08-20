import { User, UserRole, AuditLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { userService } from './userService';
import { toast } from 'sonner';
import { csrfProtection } from '../csrf';

// Interface para login
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Interface para tokens de autenticação
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp em milissegundos
}

// Interface para tentativas de login
interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Classe para gerenciar autenticação e segurança
class AuthService {
  private currentUser: User | null = null;
  private tokens: AuthTokens | null = null;
  private loginAttempts: LoginAttempt[] = [];
  private MAX_LOGIN_ATTEMPTS = 5;
  private BLOCK_DURATION_MINUTES = 10;
  private readonly DEV_MODE = process.env.NODE_ENV === 'development';
  private SESSION_TIMEOUT_MINUTES = 30;
  private ACCESS_TOKEN_EXPIRATION_MINUTES = 15;
  private REFRESH_TOKEN_EXPIRATION_DAYS = 7;
  private sessionTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadAuthState();
    
    // Em ambiente dev, pode usar credenciais padrão
    if (this.DEV_MODE && process.env.REACT_APP_USE_DEV_CREDENTIALS === 'true') {
      console.log('Desenvolvimento: Credenciais padrão habilitadas');
    }
    
    // Iniciar timer de sessão se usuário estiver logado
    if (this.currentUser) {
      this.startSessionTimer();
    }
  }

  // Carregar estado de autenticação do localStorage
  private loadAuthState(): void {
    try {
      // Carregar tokens
      const storedTokens = localStorage.getItem('authTokens');
      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens);
        
        // Verificar se o token expirou
        if (this.tokens && this.tokens.expiresAt < Date.now()) {
          console.log('Token expirado, tentando refresh');
          this.refreshToken();
        }
      }
      
      // Carregar usuário atual
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      
      // Carregar tentativas de login
      const storedAttempts = localStorage.getItem('loginAttempts');
      if (storedAttempts) {
        this.loginAttempts = JSON.parse(storedAttempts);
        
        // Limpar tentativas antigas (mais de 24h)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.loginAttempts = this.loginAttempts.filter(attempt => 
          attempt.timestamp > oneDayAgo
        );
        this.saveLoginAttempts();
      }
    } catch (error) {
      console.error('Erro ao carregar estado de autenticação:', error);
      this.logout();
    }
  }
  
  // Salvar tentativas de login
  private saveLoginAttempts(): void {
    try {
      localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
    } catch (error) {
      console.error('Erro ao salvar tentativas de login:', error);
    }
  }
  
  // Verificar hash de senha
  private verifyPassword(password: string, hash: string): boolean {
    // Em produção, usar bcrypt
    if (typeof hash === 'string' && hash.includes(':')) {
      // Formato simulado em desenvolvimento
      const [salt, storedPassword] = hash.split(':');
      return password === storedPassword;
    } else {
      // Para produção, implementaremos com bcrypt no futuro
      // Por enquanto apenas simulamos
      console.warn('Usando verificação simplificada de senha - NÃO USE EM PRODUÇÃO');
      return password === hash.substring(hash.lastIndexOf(':') + 1);
    }
  }
  
  // Registrar tentativa de login
  private logLoginAttempt(email: string, success: boolean): void {
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success,
      ipAddress: '127.0.0.1', // Em uma aplicação real, obter do request
      userAgent: navigator.userAgent
    };
    
    this.loginAttempts.push(attempt);
    this.saveLoginAttempts();
    
    // Registrar no log de auditoria
    this.logAudit(
      success ? 'login' : 'login_failed',
      'auth',
      email,
      `Login ${success ? 'bem-sucedido' : 'falhou'} para ${email}`
    );
  }
  
  // Verificar se há bloqueio por excesso de tentativas
  private isBlocked(email: string): boolean {
    const lowerEmail = email.toLowerCase();
    const recentAttempts = this.loginAttempts.filter(attempt => 
      attempt.email === lowerEmail && 
      !attempt.success && 
      attempt.timestamp > Date.now() - (this.BLOCK_DURATION_MINUTES * 60 * 1000)
    );
    
    return recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS;
  }
  
  // Gerar tokens JWT
  private generateTokens(user: User): AuthTokens {
    const accessTokenExpiry = Date.now() + (this.ACCESS_TOKEN_EXPIRATION_MINUTES * 60 * 1000);
    const refreshTokenExpiry = Date.now() + (this.REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    
    // Em produção, usar biblioteca JWT
    const accessToken = `${user.id}_${uuidv4()}_${accessTokenExpiry}`;
    const refreshToken = `${user.id}_${uuidv4()}_${refreshTokenExpiry}`;
    
    return {
      accessToken,
      refreshToken,
      expiresAt: accessTokenExpiry
    };
  }
  
  // Iniciar timer para timeout de sessão
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      console.log('Sessão expirou por inatividade');
      this.logout();
      toast.warning('Sua sessão expirou por inatividade.');
    }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }
  
  // Renovar timer de sessão (chamado em atividade do usuário)
  public renewSession(): void {
    if (this.currentUser) {
      this.startSessionTimer();
    }
  }
  
  // Registrar ação de auditoria
  private logAudit(action: string, entityType: string, entityId?: string, details?: string): void {
    const log: AuditLog = {
      id: uuidv4(),
      userId: this.currentUser?.id || 'system',
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
      ipAddress: '127.0.0.1' // Em um ambiente real, obteríamos o IP real
    };
    
    // Em um ambiente real, salvaríamos em um banco de dados
    try {
      const storedLogs = localStorage.getItem('auditLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.push(log);
      localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error);
    }
  }
  
  // Login rápido para ambiente de desenvolvimento
  public devLogin(): User | null {
    if (!this.DEV_MODE) {
      console.error('Tentativa de usar devLogin em ambiente de produção');
      return null;
    }
    
    const adminUser = userService.getUserByEmail('admin@exemplo.com');
    if (!adminUser) {
      console.error('Usuário admin não encontrado');
      return null;
    }
    
    this.currentUser = adminUser;
    this.tokens = this.generateTokens(adminUser);
    
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    localStorage.setItem('authTokens', JSON.stringify(this.tokens));
    
    this.logLoginAttempt(adminUser.email, true);
    this.startSessionTimer();
    
    return adminUser;
  }
  
  // Login com email e senha
  public login(credentials: LoginRequest): User | null {
    const { email, password, rememberMe } = credentials;
    
    // Verificar se o usuário está bloqueado
    if (this.isBlocked(email)) {
      toast.error(`Conta bloqueada por excesso de tentativas. Tente novamente após ${this.BLOCK_DURATION_MINUTES} minutos.`);
      return null;
    }
    
    // Verificar credenciais
    const user = userService.getUserByEmail(email);
    
    if (!user) {
      toast.error('Email ou senha incorretos');
      this.logLoginAttempt(email, false);
      return null;
    }
    
    // Verificar se o usuário está ativo
    if (!user.active) {
      toast.error('Esta conta está desativada. Entre em contato com o administrador.');
      this.logLoginAttempt(email, false);
      return null;
    }
    
    // Verificar senha
    if (!this.verifyPassword(password, user.passwordHash)) {
      toast.error('Email ou senha incorretos');
      this.logLoginAttempt(email, false);
      return null;
    }
    
    // Login bem-sucedido
    this.currentUser = user;
    this.tokens = this.generateTokens(user);
    
    // Persistir ou não, dependendo do "lembrar-me"
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    localStorage.setItem('authTokens', JSON.stringify(this.tokens));
    
    this.logLoginAttempt(email, true);
    this.startSessionTimer();
    
    toast.success(`Bem-vindo, ${user.name}!`);
    return user;
  }
  
  // Refresh de token 
  public refreshToken(): boolean {
    if (!this.tokens || !this.currentUser) {
      return false;
    }
    
    // Em uma implementação real, enviar o refresh token para o servidor
    // e obter um novo access token
    
    // Simulando refresh de token
    this.tokens = this.generateTokens(this.currentUser);
    localStorage.setItem('authTokens', JSON.stringify(this.tokens));
    
    return true;
  }
  
  // Logout
  public logout(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.currentUser) {
      this.logAudit('logout', 'auth', this.currentUser.id, `Logout de ${this.currentUser.email}`);
    }
    
    this.currentUser = null;
    this.tokens = null;
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authTokens');
    
    toast.info('Você foi desconectado');
  }
  
  // Logout de todas as sessões
  public logoutAllSessions(): void {
    if (!this.currentUser) {
      return;
    }
    
    // Em um cenário real, invalidaríamos todos os tokens no servidor
    this.logout();
    
    toast.success('Todas as sessões foram encerradas');
  }
  
  // Verificar se o usuário está logado
  public isLoggedIn(): boolean {
    return !!this.currentUser && !!this.tokens && this.tokens.expiresAt > Date.now();
  }
  
  // Obter usuário logado
  public getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // Verificar se o usuário tem determinada permissão
  public hasPermission(permission: keyof import('@/types').RolePermissions): boolean {
    if (!this.currentUser) {
      return false;
    }
    
    return userService.hasPermission(permission);
  }
  
  // Obter todas as tentativas de login
  public getLoginAttempts(): LoginAttempt[] {
    return this.loginAttempts;
  }
  
  // Limpar bloqueio de login
  public clearLoginBlocks(email: string): void {
    const lowerEmail = email.toLowerCase();
    this.loginAttempts = this.loginAttempts.filter(attempt => 
      attempt.email !== lowerEmail || attempt.success
    );
    this.saveLoginAttempts();
    
    toast.success(`Bloqueio de login removido para ${email}`);
    this.logAudit('clear_login_block', 'auth', email, `Bloqueio de login removido para ${email}`);
  }
  
  // Definir configurações de segurança
  public updateSecuritySettings(settings: any): void {
    // Em uma implementação real, isso atualizaria as configurações no servidor
    // Aqui apenas simulamos para a interface
    
    // Exemplo de como definir o timeout de sessão
    if (settings.sessionTimeout) {
      this.SESSION_TIMEOUT_MINUTES = settings.sessionTimeout;
      
      // Reiniciar o timer com o novo valor
      if (this.currentUser) {
        this.startSessionTimer();
      }
    }
    
    this.logAudit('update_security_settings', 'settings', 'security', 'Configurações de segurança atualizadas');
    toast.success('Configurações de segurança atualizadas');
  }
  
  // Obter tokens de autenticação
  public getTokens(): AuthTokens | null {
    return this.tokens;
  }
}

// Exportar instância única
export const authService = new AuthService(); 