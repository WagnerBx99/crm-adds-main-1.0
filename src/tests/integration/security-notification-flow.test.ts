import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '@/lib/security/notificationService';
import { emailService } from '@/lib/security/emailService';
import { logService, LogEventType, LogSeverity } from '@/lib/security/logService';
import { NotificationTemplate } from '@/lib/security/emailTemplates';

// Mock dos serviços
vi.mock('@/lib/security/logService');
vi.mock('@/lib/security/emailService');

describe('Fluxo de Notificações de Segurança (Integração)', () => {
  const mockUserId = 'user123';
  const mockEmail = 'usuario@empresa.com.br';
  const mockUsername = 'João Silva';
  
  // Mock de CustomEvent para testar disparo de eventos
  const customEventMock = vi.fn();
  const dispatchEventMock = vi.fn();
  
  // Backup do localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  };
  
  beforeEach(() => {
    // Setup dos mocks
    global.localStorage = localStorageMock as any;
    global.CustomEvent = customEventMock as any;
    global.dispatchEvent = dispatchEventMock;
    
    // Configurar mocks de funções específicas
    (logService.log as any).mockImplementation((eventType, severity, action, details, context) => {
      return {
        id: 'log123',
        timestamp: Date.now(),
        eventType,
        severity,
        action,
        details,
        userId: context?.userId,
        username: context?.username
      };
    });
    
    (emailService.sendNotificationToUser as any).mockResolvedValue(true);
    
    // Limpar contadores de chamadas
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deve registrar log e enviar notificações quando ocorre uma atividade suspeita', async () => {
    // Simular uma atividade suspeita
    const logEntry = logService.log(
      LogEventType.SUSPICIOUS_ACTIVITY,
      LogSeverity.WARNING,
      'Múltiplas tentativas de login falhas',
      { attemptCount: 5, ipAddress: '192.168.1.1' },
      { userId: mockUserId, username: mockUsername }
    );
    
    // Enviar notificação
    await notificationService.notifySecurityEvent(logEntry, {
      userId: mockUserId,
      email: mockEmail,
      username: mockUsername,
      channels: ['email', 'in-app']
    });
    
    // Verificar se o log foi registrado corretamente
    expect(logService.log).toHaveBeenCalledTimes(1);
    expect(logService.log).toHaveBeenCalledWith(
      LogEventType.SUSPICIOUS_ACTIVITY,
      LogSeverity.WARNING,
      'Múltiplas tentativas de login falhas',
      { attemptCount: 5, ipAddress: '192.168.1.1' },
      { userId: mockUserId, username: mockUsername }
    );
    
    // Verificar se o email foi enviado
    expect(emailService.sendNotificationToUser).toHaveBeenCalled();
    expect(emailService.sendNotificationToUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        username: mockUsername,
        action: 'Múltiplas tentativas de login falhas'
      }),
      { email: mockEmail, name: mockUsername }
    );
    
    // Verificar se o evento de notificação in-app foi disparado
    expect(global.CustomEvent).toHaveBeenCalledTimes(1);
    expect(global.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('deve enviar notificações com prioridade apropriada baseada na severidade do log', async () => {
    // Criar log com severidade crítica
    const logEntry = logService.log(
      LogEventType.CRITICAL_ERROR,
      LogSeverity.CRITICAL,
      'Falha crítica de segurança',
      { systemComponent: 'auth', errorCode: 'SEC-500' },
      { userId: mockUserId, username: mockUsername }
    );
    
    // Enviar notificação
    await notificationService.notifySecurityEvent(logEntry, {
      userId: mockUserId,
      email: mockEmail,
      username: mockUsername,
      channels: ['email', 'in-app']
    });
    
    // Verificar se a notificação foi criada com prioridade crítica
    expect(global.CustomEvent).toHaveBeenCalledWith(
      'securityNotification',
      expect.objectContaining({
        detail: expect.objectContaining({
          priority: 'critical',
          userId: mockUserId
        })
      })
    );
    
    // Verificar se o email de alerta crítico foi enviado
    expect(emailService.sendNotificationToUser).toHaveBeenCalledWith(
      NotificationTemplate.CRITICAL_ERROR,
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('deve respeitar as configurações de canais habilitados', async () => {
    // Simular configuração com email desabilitado
    vi.spyOn(notificationService, 'getChannelSettings').mockReturnValue({
      emailEnabled: false,
      inAppEnabled: true,
      smsEnabled: false,
      webhooksEnabled: false
    });
    
    // Criar log de atividade
    const logEntry = logService.log(
      LogEventType.SENSITIVE_DATA_ACCESS,
      LogSeverity.INFO,
      'Acesso a dados sensíveis',
      { dataType: 'financeiro' },
      { userId: mockUserId, username: mockUsername }
    );
    
    // Enviar notificação
    await notificationService.notifySecurityEvent(logEntry, {
      userId: mockUserId,
      email: mockEmail,
      username: mockUsername,
      channels: ['email', 'in-app']
    });
    
    // Verificar que a notificação in-app foi enviada
    expect(global.CustomEvent).toHaveBeenCalledTimes(1);
    expect(global.dispatchEvent).toHaveBeenCalledTimes(1);
    
    // Verificar que o email NÃO foi enviado
    expect(emailService.sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('deve filtrar eventos baseado nas configurações de notificação', async () => {
    // Simular configuração com filtro de eventos
    vi.spyOn(notificationService, 'shouldNotifyForEvent').mockImplementation((eventType, severity) => {
      // Apenas notificar para eventos críticos
      return severity === LogSeverity.CRITICAL;
    });
    
    // Criar log de baixa severidade
    const logEntry = logService.log(
      LogEventType.USER_UPDATED,
      LogSeverity.INFO,
      'Usuário atualizado',
      { updatedFields: ['nome', 'email'] },
      { userId: mockUserId, username: mockUsername }
    );
    
    // Tentar enviar notificação
    await notificationService.notifySecurityEvent(logEntry, {
      userId: mockUserId,
      email: mockEmail,
      username: mockUsername,
      channels: ['email', 'in-app']
    });
    
    // Verificar que NENHUMA notificação foi enviada
    expect(global.CustomEvent).not.toHaveBeenCalled();
    expect(global.dispatchEvent).not.toHaveBeenCalled();
    expect(emailService.sendNotificationToUser).not.toHaveBeenCalled();
  });
}); 