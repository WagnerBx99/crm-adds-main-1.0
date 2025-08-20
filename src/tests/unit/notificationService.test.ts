import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '@/lib/security/notificationService';
import { logService } from '@/lib/security/logService';

// Mock do módulo logService
vi.mock('@/lib/security/logService', () => {
  return {
    logService: {
      log: vi.fn()
    }
  };
});

describe('NotificationService', () => {
  // Backup do localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  };
  
  // Mock de CustomEvent para testar disparo de eventos
  const customEventMock = vi.fn();
  
  beforeEach(() => {
    // Setup dos mocks
    global.localStorage = localStorageMock as any;
    global.CustomEvent = customEventMock as any;
    global.dispatchEvent = vi.fn();
    
    // Limpar contadores de chamadas
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deve enviar uma notificação com sucesso', () => {
    const notification = {
      userId: 'user123',
      priority: 'high',
      title: 'Alerta de Segurança',
      message: 'Tentativa de login suspeita',
      template: 'SUSPICIOUS_ACTIVITY',
      channels: ['email', 'in-app']
    };
    
    notificationService.sendNotification(notification);
    
    // Verificar se o log foi registrado
    expect(logService.log).toHaveBeenCalledTimes(1);
    
    // Verificar se o evento foi disparado
    expect(global.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('deve filtrar notificações por prioridade', () => {
    // Mock de notificações
    const notifications = [
      { id: '1', priority: 'low', read: false },
      { id: '2', priority: 'medium', read: false },
      { id: '3', priority: 'high', read: false },
      { id: '4', priority: 'critical', read: false }
    ];
    
    // Mock retorno do localStorage
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(notifications));
    
    // Obter apenas notificações de alta prioridade
    const highPriorityNotifications = notificationService.getNotifications('user123', ['high', 'critical']);
    
    // Verificar se o filtro funcionou
    expect(highPriorityNotifications).toHaveLength(2);
    expect(highPriorityNotifications[0].id).toBe('3');
    expect(highPriorityNotifications[1].id).toBe('4');
  });

  it('deve marcar notificação como lida', () => {
    // Mock de notificações
    const notifications = [
      { id: '1', userId: 'user123', priority: 'high', read: false },
    ];
    
    // Mock retorno do localStorage
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(notifications));
    
    // Marcar notificação como lida
    const result = notificationService.markAsRead('user123', '1');
    
    // Verificar se a notificação foi marcada como lida
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('deve contar corretamente notificações não lidas', () => {
    // Mock de notificações
    const notifications = [
      { id: '1', userId: 'user123', priority: 'low', read: false },
      { id: '2', userId: 'user123', priority: 'medium', read: true },
      { id: '3', userId: 'user123', priority: 'high', read: false },
      { id: '4', userId: 'other-user', priority: 'critical', read: false }
    ];
    
    // Mock retorno do localStorage
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(notifications));
    
    // Contar notificações não lidas
    const unreadCount = notificationService.getUnreadCount('user123');
    
    // Verificar se a contagem está correta
    expect(unreadCount).toBe(2);
  });
}); 