/**
 * Serviço de Email para Notificações de Segurança
 * 
 * Este módulo fornece funcionalidades para envio de emails de notificações
 * de segurança, integrando com os templates de email disponíveis.
 */

import { LogEntry } from './logService';
import { NotificationTemplate, EmailTemplate, generateEmailTemplate, generateEmailFromLog } from './emailTemplates';

// Interface para destinatário de email
export interface EmailRecipient {
  email: string;
  name?: string;
}

// Interface para configurações de email
export interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  adminEmails: string[];
  securityEmails: string[];
  notificationsEnabled: boolean;
  criticalAlertsEnabled: boolean;
  dailyDigestEnabled: boolean;
  smtpSettings?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    }
  };
}

class EmailService {
  private static instance: EmailService;
  private readonly STORAGE_KEY = 'email_service_config';
  private config: EmailConfig = {
    fromEmail: 'seguranca@empresarial.com.br',
    fromName: 'Segurança CRM Empresarial',
    replyToEmail: 'naoresponda@empresarial.com.br',
    adminEmails: ['admin@empresarial.com.br'],
    securityEmails: ['seguranca@empresarial.com.br'],
    notificationsEnabled: true,
    criticalAlertsEnabled: true,
    dailyDigestEnabled: true
  };
  
  private queuedEmails: Array<{template: EmailTemplate, recipients: EmailRecipient[]}> = [];
  
  private constructor() {
    this.loadConfigFromStorage();
  }
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  /**
   * Carregar configuração do armazenamento local
   */
  private loadConfigFromStorage(): void {
    try {
      const storedConfig = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
        console.log('Configuração do serviço de email carregada');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do serviço de email:', error);
    }
  }
  
  /**
   * Salvar configuração no armazenamento local
   */
  private saveConfigToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Erro ao salvar configuração do serviço de email:', error);
    }
  }
  
  /**
   * Atualizar configuração do serviço de email
   * @param config Nova configuração (parcial)
   */
  public updateConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfigToStorage();
  }
  
  /**
   * Obter configuração atual
   * @returns Configuração atual do serviço de email
   */
  public getConfig(): EmailConfig {
    return { ...this.config };
  }
  
  /**
   * Enviar email usando a API de email (simulado)
   * Em um sistema real, integraria com um serviço de email como SendGrid, Mailgun, Amazon SES, etc.
   * @param template Template de email a ser enviado
   * @param recipients Destinatários do email
   * @returns Promise com resultado do envio
   */
  private async sendEmail(template: EmailTemplate, recipients: EmailRecipient[]): Promise<boolean> {
    // Verificar se notificações estão habilitadas
    if (!this.config.notificationsEnabled) {
      console.log('Notificações de email estão desativadas');
      return false;
    }
    
    try {
      // Simulação: em um ambiente real, chamaria uma API de email
      console.log(`[EMAIL] Enviando email "${template.subject}" para ${recipients.length} destinatários`);
      console.log('De:', this.config.fromName, `<${this.config.fromEmail}>`);
      console.log('Para:', recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', '));
      console.log('Assunto:', template.subject);
      console.log('Conteúdo Text:', template.textContent.substring(0, 150) + '...');
      console.log('Conteúdo HTML:', template.htmlContent.substring(0, 150) + '...');
      
      // Adicionar email à fila para simulação de envio em sistema real
      this.queuedEmails.push({ template, recipients });
      
      // Simulação de atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
  
  /**
   * Enviar email a partir de um template
   * @param template Template de email
   * @param to Destinatários
   * @returns Promise com resultado do envio
   */
  public async sendEmailWithTemplate(template: EmailTemplate, to: EmailRecipient[]): Promise<boolean> {
    return this.sendEmail(template, to);
  }
  
  /**
   * Enviar email de notificação para um usuário
   * @param templateType Tipo de template
   * @param data Dados para o template
   * @param recipient Destinatário
   * @returns Promise com resultado do envio
   */
  public async sendNotificationToUser(
    templateType: NotificationTemplate, 
    data: {
      username?: string;
      timestamp?: number;
      ipAddress?: string;
      userAgent?: string;
      action?: string;
      details?: any;
    }, 
    recipient: EmailRecipient
  ): Promise<boolean> {
    const template = generateEmailTemplate(templateType, {
      ...data,
      username: recipient.name || data.username,
    });
    
    return this.sendEmail(template, [recipient]);
  }
  
  /**
   * Enviar alerta de segurança para administradores
   * @param logEntry Entrada de log que gerou o alerta
   * @returns Promise com resultado do envio
   */
  public async sendSecurityAlert(logEntry: LogEntry): Promise<boolean> {
    // Verificar se alertas críticos estão habilitados
    if (!this.config.criticalAlertsEnabled) {
      console.log('Alertas de segurança estão desativados');
      return false;
    }
    
    // Gerar template com base no log
    const template = generateEmailFromLog(logEntry);
    
    // Criar lista de destinatários combinando administradores e equipe de segurança
    const recipients: EmailRecipient[] = [
      ...this.config.adminEmails.map(email => ({ email })),
      ...this.config.securityEmails.map(email => ({ email }))
    ];
    
    return this.sendEmail(template, recipients);
  }
  
  /**
   * Enviar notificação para usuário com base em evento de log
   * @param logEntry Entrada de log
   * @param userEmail Email do usuário
   * @param userName Nome do usuário (opcional)
   * @returns Promise com resultado do envio
   */
  public async sendUserNotificationFromLog(
    logEntry: LogEntry, 
    userEmail: string, 
    userName?: string
  ): Promise<boolean> {
    // Gerar template com base no log
    const template = generateEmailFromLog(logEntry);
    
    // Criar destinatário
    const recipient: EmailRecipient = {
      email: userEmail,
      name: userName || logEntry.username
    };
    
    return this.sendEmail(template, [recipient]);
  }
  
  /**
   * Obter fila de emails pendentes (para simulação)
   * @returns Fila de emails pendentes
   */
  public getPendingEmails(): Array<{template: EmailTemplate, recipients: EmailRecipient[]}> {
    return [...this.queuedEmails];
  }
  
  /**
   * Limpar fila de emails pendentes (para simulação)
   */
  public clearPendingEmails(): void {
    this.queuedEmails = [];
  }
}

// Exportar instância única
export const emailService = EmailService.getInstance(); 