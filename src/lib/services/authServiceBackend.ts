/**
 * Serviço de autenticação que usa o backend PostgreSQL
 * 
 * Este serviço substitui o authService baseado em localStorage
 * para usar o backend real com JWT e PostgreSQL.
 */

import { User, AuditLog } from '@/types';
import { apiService } from './apiService';
import { toast } from 'sonner';
import { USE_BACKEND_API } from '@/config';

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
  expiresAt: number;
}

// Interface para tentativas de login
interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Classe para gerenciar autenticação com backend
class AuthServiceBackend {
  private currentUser: User | null = null;
  private loginAttempts: LoginAttempt[] = [];
  private MAX_LOGIN_ATTEMPTS = 5;
  private BLOCK_DURATION_MINUTES = 10;
  private readonly DEV_MODE = import.meta.env.DEV;
  private SESSION_TIMEOUT_MINUTES = 30;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadAuthState();
    
    // Iniciar timer de sessão se usuário estiver logado
    if (this.currentUser) {
      this.startSessionTimer();
    }
  }

  // Carregar estado de autenticação
  private loadAuthState(): void {
    try {
      const user = apiService.getUser();
      if (user && apiService.isAuthenticated()) {
        this.currentUser = user as unknown as User;
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

  // Registrar tentativa de login
  private logLoginAttempt(email: string, success: boolean): void {
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    };
    
    this.loginAttempts.push(attempt);
    this.saveLoginAttempts();
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

  // Renovar timer de sessão
  public renewSession(): void {
    if (this.currentUser) {
      this.startSessionTimer();
    }
  }

  // Login rápido para ambiente de desenvolvimento
  public async devLogin(): Promise<User | null> {
    if (!this.DEV_MODE) {
      console.error('Tentativa de usar devLogin em ambiente de produção');
      return null;
    }
    
    try {
      const response = await apiService.login('admin@exemplo.com', 'admin123');
      this.currentUser = response.user as unknown as User;
      this.logLoginAttempt(response.user.email, true);
      this.startSessionTimer();
      return this.currentUser;
    } catch (error) {
      console.error('Erro no devLogin:', error);
      return null;
    }
  }

  // Login com email e senha
  public async login(credentials: LoginRequest): Promise<User | null> {
    const { email, password } = credentials;
    
    // Verificar se o usuário está bloqueado
    if (this.isBlocked(email)) {
      toast.error(`Conta bloqueada por excesso de tentativas. Tente novamente após ${this.BLOCK_DURATION_MINUTES} minutos.`);
      return null;
    }
    
    try {
      const response = await apiService.login(email, password);
      
      this.currentUser = response.user as unknown as User;
      this.logLoginAttempt(email, true);
      this.startSessionTimer();
      
      toast.success(`Bem-vindo, ${response.user.name}!`);
      return this.currentUser;
    } catch (error: any) {
      toast.error(error.message || 'Email ou senha incorretos');
      this.logLoginAttempt(email, false);
      return null;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    try {
      await apiService.logout();
    } catch {
      // Ignora erros no logout
    }
    
    this.currentUser = null;
    toast.info('Você foi desconectado');
  }

  // Verificar se o usuário está logado
  public isLoggedIn(): boolean {
    return !!this.currentUser && apiService.isAuthenticated();
  }

  // Obter usuário logado
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Verificar se o usuário tem determinada permissão
  public hasPermission(permission: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    
    // Permissões baseadas em role
    const rolePermissions: Record<string, string[]> = {
      MASTER: ['*'], // Todas as permissões
      GESTOR: ['view_orders', 'edit_orders', 'view_customers', 'edit_customers', 'view_products', 'view_reports'],
      PRESTADOR: ['view_orders', 'edit_own_orders']
    };
    
    const userRole = this.currentUser.role;
    const permissions = rolePermissions[userRole] || [];
    
    return permissions.includes('*') || permissions.includes(permission);
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
  }

  // Definir configurações de segurança
  public updateSecuritySettings(settings: any): void {
    if (settings.sessionTimeout) {
      this.SESSION_TIMEOUT_MINUTES = settings.sessionTimeout;
      
      if (this.currentUser) {
        this.startSessionTimer();
      }
    }
    
    toast.success('Configurações de segurança atualizadas');
  }

  // Obter tokens de autenticação
  public getTokens(): AuthTokens | null {
    const token = apiService.getToken();
    if (!token) return null;
    
    return {
      accessToken: token,
      refreshToken: '',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
    };
  }
}

// Exportar instância única
export const authServiceBackend = new AuthServiceBackend();
