import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';

// Tipos para o sistema de notificações
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in-app' | 'email' | 'both';
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly';

export interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  template?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  eventId?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  useTLS: boolean;
  apiKey?: string;
  apiProvider?: 'sendgrid' | 'mailgun';
  enabled?: boolean;
}

export interface NotificationPreference {
  userId: string;
  eventId: string;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  eventId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
}

export interface NotificationLog {
  id: string;
  eventId: string;
  userId: string;
  channel: NotificationChannel;
  status: 'success' | 'error' | 'pending' | 'sent' | 'failed';
  error?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Dados padrão para eventos de notificação
const defaultNotificationEvents: NotificationEvent[] = [
  {
    id: 'order_created',
    name: 'Pedido Criado',
    description: 'Quando um novo pedido é criado',
    category: 'Pedidos',
    enabled: true,
    channels: ['in-app', 'email'],
    frequency: 'immediate'
  },
  {
    id: 'order_status_changed',
    name: 'Status do Pedido Alterado',
    description: 'Quando o status de um pedido é alterado',
    category: 'Pedidos',
    enabled: true,
    channels: ['in-app', 'email'],
    frequency: 'immediate'
  },
  {
    id: 'comment_added',
    name: 'Novo Comentário',
    description: 'Quando um novo comentário é adicionado',
    category: 'Comunicação',
    enabled: true,
    channels: ['in-app', 'email'],
    frequency: 'immediate'
  },
  {
    id: 'mention',
    name: 'Menção',
    description: 'Quando um usuário é mencionado',
    category: 'Comunicação',
    enabled: true,
    channels: ['in-app', 'email'],
    frequency: 'immediate'
  },
  {
    id: 'attachment_added',
    name: 'Novo Anexo',
    description: 'Quando um novo anexo é adicionado',
    category: 'Arquivos',
    enabled: true,
    channels: ['in-app', 'email'],
    frequency: 'immediate'
  }
];

// Dados padrão para templates de email
const defaultEmailTemplates: NotificationTemplate[] = [
  {
    id: uuidv4(),
    name: 'Novo Pedido',
    subject: 'Novo pedido criado: {orderNumber}',
    body: `
      <h2>Novo Pedido Criado</h2>
      <p>Olá {userName},</p>
      <p>Um novo pedido foi criado:</p>
      <ul>
        <li>Número: {orderNumber}</li>
        <li>Cliente: {customerName}</li>
        <li>Valor: {orderValue}</li>
      </ul>
      <p><a href="{orderLink}">Clique aqui para ver o pedido</a></p>
    `,
    variables: ['userName', 'orderNumber', 'customerName', 'orderValue', 'orderLink']
  },
  {
    id: uuidv4(),
    name: 'Status do Pedido Alterado',
    subject: 'Status do pedido {orderNumber} alterado para {newStatus}',
    body: `
      <h2>Status do Pedido Alterado</h2>
      <p>Olá {userName},</p>
      <p>O status do pedido {orderNumber} foi alterado:</p>
      <ul>
        <li>Status anterior: {oldStatus}</li>
        <li>Novo status: {newStatus}</li>
        <li>Alterado por: {changedBy}</li>
      </ul>
      <p><a href="{orderLink}">Clique aqui para ver o pedido</a></p>
    `,
    variables: ['userName', 'orderNumber', 'oldStatus', 'newStatus', 'changedBy', 'orderLink']
  }
];

// Configuração padrão de email
const defaultEmailConfig: EmailConfig = {
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  fromEmail: '',
  fromName: '',
  useTLS: true
};

class NotificationService {
  private events: NotificationEvent[] = [];
  private templates: NotificationTemplate[] = [];
  private notifications: Notification[] = [];
  private preferences: NotificationPreference[] = [];
  private logs: NotificationLog[] = [];
  private emailConfig: EmailConfig = defaultEmailConfig;
  private ws: WebSocket | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    // Carregar eventos de notificação
    const storedEvents = localStorage.getItem('notification_events');
    if (storedEvents) {
      this.events = JSON.parse(storedEvents);
    } else {
      this.events = defaultNotificationEvents;
      localStorage.setItem('notification_events', JSON.stringify(this.events));
    }

    // Carregar templates de email
    const storedTemplates = localStorage.getItem('notification_templates');
    if (storedTemplates) {
      this.templates = JSON.parse(storedTemplates);
    } else {
      this.templates = defaultEmailTemplates;
      localStorage.setItem('notification_templates', JSON.stringify(this.templates));
    }

    // Carregar configuração de email
    const storedEmailConfig = localStorage.getItem('notification_email_config');
    if (storedEmailConfig) {
      this.emailConfig = JSON.parse(storedEmailConfig);
    } else {
      this.emailConfig = defaultEmailConfig;
      localStorage.setItem('notification_email_config', JSON.stringify(this.emailConfig));
    }

    // Carregar notificações
    const storedNotifications = localStorage.getItem('notification_notifications');
    if (storedNotifications) {
      this.notifications = JSON.parse(storedNotifications);
    } else {
      this.notifications = [];
      localStorage.setItem('notification_notifications', JSON.stringify(this.notifications));
    }

    // Carregar preferências de notificação
    const storedPreferences = localStorage.getItem('notification_preferences');
    if (storedPreferences) {
      this.preferences = JSON.parse(storedPreferences);
    } else {
      this.preferences = [];
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    }

    // Carregar logs de notificação
    const storedLogs = localStorage.getItem('notification_logs');
    if (storedLogs) {
      this.logs = JSON.parse(storedLogs);
    } else {
      this.logs = [];
      localStorage.setItem('notification_logs', JSON.stringify(this.logs));
    }
  }

  private saveData() {
    localStorage.setItem('notification_events', JSON.stringify(this.events));
    localStorage.setItem('notification_templates', JSON.stringify(this.templates));
    localStorage.setItem('notification_email_config', JSON.stringify(this.emailConfig));
    localStorage.setItem('notification_notifications', JSON.stringify(this.notifications));
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    localStorage.setItem('notification_logs', JSON.stringify(this.logs));
  }

  // Métodos para gerenciar eventos de notificação
  getEvents(): NotificationEvent[] {
    return this.events;
  }

  getEventById(eventId: string): NotificationEvent | undefined {
    return this.events.find(event => event.id === eventId);
  }

  updateEvent(eventId: string, updates: Partial<NotificationEvent>): NotificationEvent | null {
    const index = this.events.findIndex(event => event.id === eventId);
    if (index === -1) return null;

    this.events[index] = { ...this.events[index], ...updates };
    this.saveData();
    return this.events[index];
  }

  // Métodos para gerenciar templates de email
  getTemplates(): NotificationTemplate[] {
    return this.templates;
  }

  getTemplateById(templateId: string): NotificationTemplate | undefined {
    return this.templates.find(template => template.id === templateId);
  }

  getTemplateByEventId(eventId: string): NotificationTemplate | undefined {
    return this.templates.find(template => template.eventId === eventId && template.active);
  }

  createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt'>): NotificationTemplate {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: new Date()
    };

    this.templates.push(newTemplate);
    this.saveData();
    return newTemplate;
  }

  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): NotificationTemplate | null {
    const index = this.templates.findIndex(template => template.id === templateId);
    if (index === -1) return null;

    this.templates[index] = { 
      ...this.templates[index], 
      ...updates,
      updatedAt: new Date()
    };
    this.saveData();
    return this.templates[index];
  }

  deleteTemplate(templateId: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(template => template.id !== templateId);
    
    if (this.templates.length !== initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Métodos para gerenciar configuração de email
  getEmailConfig(): EmailConfig {
    return this.emailConfig;
  }

  updateEmailConfig(updates: Partial<EmailConfig>): EmailConfig {
    this.emailConfig = { ...this.emailConfig, ...updates };
    this.saveData();
    return this.emailConfig;
  }

  testEmailConnection(): Promise<boolean> {
    // Simulação de teste de conexão SMTP
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% de chance de sucesso
        if (success) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1500);
    });
  }

  // Métodos para gerenciar notificações
  getNotifications(userId: string): Notification[] {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter(notification => notification.userId === userId && !notification.read).length;
  }

  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    this.saveData();
    return true;
  }

  markAllAsRead(userId: string): number {
    let count = 0;
    this.notifications.forEach(notification => {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        count++;
      }
    });

    if (count > 0) {
      this.saveData();
    }
    return count;
  }

  deleteNotification(notificationId: string): boolean {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    
    if (this.notifications.length !== initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  clearAllNotifications(userId: string): number {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.userId !== userId);
    
    const deletedCount = initialLength - this.notifications.length;
    if (deletedCount > 0) {
      this.saveData();
    }
    return deletedCount;
  }

  // Métodos para gerenciar preferências de notificação
  getUserPreferences(userId: string): NotificationPreference[] {
    return this.preferences.filter(pref => pref.userId === userId);
  }

  setUserPreference(userId: string, eventId: string, channel: NotificationChannel, enabled: boolean): NotificationPreference {
    const existingIndex = this.preferences.findIndex(
      pref => pref.userId === userId && pref.eventId === eventId
    );

    if (existingIndex !== -1) {
      this.preferences[existingIndex] = { userId, eventId, channels: [channel], enabled };
    } else {
      this.preferences.push({ userId, eventId, channels: [channel], enabled });
    }

    this.saveData();
    return { userId, eventId, channels: [channel], enabled };
  }

  // Métodos para enviar notificações
  sendNotification(
    userId: string, 
    eventId: string, 
    data: Record<string, any>
  ): { inApp: boolean, email: boolean } {
    const event = this.getEventById(eventId);
    if (!event || !event.enabled) return { inApp: false, email: false };

    // Verificar preferências do usuário
    const userPref = this.preferences.find(
      pref => pref.userId === userId && pref.eventId === eventId
    );
    
    const channel = userPref?.channels[0] || event.channels[0];
    if (!userPref?.enabled && userPref !== undefined) {
      return { inApp: false, email: false };
    }

    const result = { inApp: false, email: false };

    // Enviar notificação in-app
    if (channel === 'in-app' || channel === 'both') {
      const inAppNotification: Notification = {
        id: uuidv4(),
        userId,
        title: this.replaceVariables(this.getNotificationTitle(eventId), data),
        message: this.replaceVariables(this.getNotificationMessage(eventId), data),
        type: this.getNotificationType(eventId),
        read: false,
        createdAt: new Date(),
        eventId,
        entityId: data.entityId,
        entityType: data.entityType,
        link: data.link
      };

      this.notifications.push(inAppNotification);
      this.saveData();
      
      // Simular envio via WebSocket
      if (this.ws) {
        console.log('WebSocket: notification sent', inAppNotification);
      }

      // Registrar log
      this.logNotification({
        eventId: inAppNotification.id,
        userId,
        channel: 'in-app',
        status: 'success',
        metadata: {
          userId,
          eventId,
          type: inAppNotification.type,
          title: inAppNotification.title,
          message: inAppNotification.message,
          read: inAppNotification.read,
          createdAt: inAppNotification.createdAt,
          link: inAppNotification.link,
          entityId: inAppNotification.entityId,
          entityType: inAppNotification.entityType
        }
      });
      result.inApp = true;
    }

    // Enviar notificação por email
    if ((channel === 'email' || channel === 'both') && this.emailConfig.enabled) {
      const template = this.getTemplateByEventId(eventId);
      if (template) {
        const emailNotificationId = uuidv4();
        
        // Simular envio de email
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% de chance de sucesso
          
          if (success) {
            this.logNotification({
              eventId: emailNotificationId,
              userId,
              channel: 'email',
              status: 'success',
              metadata: {
                userId,
                eventId,
                type: this.getNotificationType(eventId),
                title: this.replaceVariables(template.subject, data),
                message: this.replaceVariables(template.body, data)
              }
            });
            console.log('Email sent:', {
              to: data.userEmail || 'user@example.com',
              subject: this.replaceVariables(template.subject, data),
              body: this.replaceVariables(template.body, data)
            });
          } else {
            this.logNotification({
              eventId: emailNotificationId,
              userId,
              channel: 'email',
              status: 'error',
              error: 'Falha na conexão com o servidor SMTP',
              metadata: {
                userId,
                eventId,
                type: this.getNotificationType(eventId)
              }
            });
            console.error('Email sending failed');
          }
        }, 500);
        
        result.email = true;
      }
    }

    return result;
  }

  // Métodos para logs de notificação
  getLogs(): NotificationLog[] {
    return this.logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private logNotification(logData: {
    eventId: string;
    userId: string;
    channel: NotificationChannel;
    status: 'success' | 'error' | 'pending';
    error?: string;
    metadata?: Record<string, any>;
  }): NotificationLog {
    const log: NotificationLog = {
      id: uuidv4(),
      eventId: logData.eventId,
      userId: logData.userId,
      channel: logData.channel,
      status: logData.status,
      error: logData.error,
      createdAt: new Date(),
      metadata: logData.metadata
    };

    this.logs.push(log);
    this.saveData();
    return log;
  }

  // Métodos auxiliares
  private getNotificationTitle(eventId: string): string {
    switch (eventId) {
      case 'order_created':
        return 'Novo pedido criado: {{orderTitle}}';
      case 'order_status_changed':
        return 'Status atualizado: {{orderTitle}}';
      case 'comment_added':
        return 'Novo comentário em {{orderTitle}}';
      case 'mention':
        return '{{mentionedBy}} mencionou você em {{orderTitle}}';
      case 'attachment_added':
        return 'Novo anexo em {{orderTitle}}';
      default:
        return 'Nova notificação';
    }
  }

  private getNotificationMessage(eventId: string): string {
    switch (eventId) {
      case 'order_created':
        return 'Um novo pedido foi criado: {{orderTitle}}';
      case 'order_status_changed':
        return 'O status do pedido {{orderTitle}} foi alterado de {{previousStatus}} para {{newStatus}}';
      case 'comment_added':
        return '{{commentAuthor}} adicionou um comentário ao pedido {{orderTitle}}';
      case 'mention':
        return '{{mentionedBy}} mencionou você em um comentário no pedido {{orderTitle}}';
      case 'attachment_added':
        return 'Um novo anexo foi adicionado ao pedido {{orderTitle}}';
      default:
        return 'Você recebeu uma nova notificação';
    }
  }

  private getNotificationType(eventId: string): NotificationType {
    switch (eventId) {
      case 'order_created':
      case 'comment_added':
      case 'attachment_added':
        return 'info';
      case 'order_status_changed':
        return 'success';
      case 'mention':
        return 'warning';
      default:
        return 'info';
    }
  }

  private replaceVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  }

  // Métodos para simulação de WebSocket
  connectWebSocket(userId: string): void {
    try {
      // Verificar se estamos em ambiente de desenvolvimento
      const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      
      // Obter a porta atual do servidor
      const currentPort = window.location.port || '8094';
      
      // Simulação de conexão WebSocket
      console.log('Tentando conectar WebSocket...');
      
      // Usar a porta atual do servidor para o WebSocket
      this.ws = new WebSocket(`ws://localhost:${currentPort}/notifications`);
      
      // Definir timeout para a conexão
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          this.ws.close();
        }
      }, 5000);
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado com sucesso');
        clearTimeout(connectionTimeout);
      };
      
      this.ws.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        this.notifications.push(notification);
        this.saveData();
      };
      
      this.ws.onerror = (error) => {
        console.log('WebSocket error - serviço de notificações não está disponível');
        clearTimeout(connectionTimeout);
        
        // Não registrar erro no log para evitar spam
        if (isDev) {
          console.debug('WebSocket error:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        clearTimeout(connectionTimeout);
      };
    } catch (error) {
      console.log('Erro ao inicializar WebSocket:', error);
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('WebSocket disconnected');
  }

  // Métodos para testes e demonstração
  generateDemoNotifications(userId: string, count: number = 5) {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error'];
    const events = this.events.filter(e => e.enabled);
    
    for (let i = 0; i < count; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const notification: Notification = {
        id: uuidv4(),
        userId,
        title: `Demo: ${event.name}`,
        message: `Esta é uma notificação de demonstração para o evento "${event.name}"`,
        type,
        read: Math.random() > 0.7, // 30% de chance de estar lida
        link: '#',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Até 7 dias atrás
        eventId: event.id
      };
      
      this.notifications.push(notification);
    }
    
    this.saveData();
    return this.getNotifications(userId);
  }
}

export const notificationService = new NotificationService(); 