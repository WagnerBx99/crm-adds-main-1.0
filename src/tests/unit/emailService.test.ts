import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emailService } from '@/lib/security/emailService';
import { generateEmailTemplate, NotificationTemplate } from '@/lib/security/emailTemplates';

describe('EmailService', () => {
  // Backup do localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  };
  
  // Mock do console
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {})
  };
  
  beforeEach(() => {
    // Setup dos mocks
    global.localStorage = localStorageMock as any;
    
    // Configurar mock do localStorage para retornar configuração
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      fromEmail: 'teste@empresa.com.br',
      fromName: 'Sistema de Testes',
      notificationsEnabled: true,
      criticalAlertsEnabled: true
    }));
    
    // Limpar contadores de chamadas
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deve carregar a configuração do localStorage', () => {
    const config = emailService.getConfig();
    
    expect(config.fromEmail).toBe('teste@empresa.com.br');
    expect(config.fromName).toBe('Sistema de Testes');
    expect(config.notificationsEnabled).toBe(true);
    expect(localStorageMock.getItem).toHaveBeenCalled();
  });

  it('deve atualizar corretamente a configuração', () => {
    // Nova configuração
    const newConfig = {
      fromEmail: 'novo@empresa.com.br',
      fromName: 'Novo Nome'
    };
    
    // Atualizar configuração
    emailService.updateConfig(newConfig);
    
    // Verificar se localStorage foi chamado
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Verificar se a configuração foi atualizada corretamente
    const config = emailService.getConfig();
    expect(config.fromEmail).toBe('novo@empresa.com.br');
    expect(config.fromName).toBe('Novo Nome');
    // Deve manter valores não alterados
    expect(config.notificationsEnabled).toBe(true);
  });

  it('deve enviar email para usuário corretamente', async () => {
    // Enviar notificação para usuário
    const result = await emailService.sendNotificationToUser(
      NotificationTemplate.LOGIN_NEW_DEVICE,
      {
        username: 'João Silva',
        timestamp: Date.now(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      },
      {
        email: 'usuario@empresa.com.br',
        name: 'João Silva'
      }
    );
    
    // Verificar se o email foi "enviado"
    expect(result).toBe(true);
    expect(consoleSpy.log).toHaveBeenCalled();
    
    // Verificar fila de emails
    const pendingEmails = emailService.getPendingEmails();
    expect(pendingEmails).toHaveLength(1);
    expect(pendingEmails[0].recipients[0].email).toBe('usuario@empresa.com.br');
  });

  it('deve respeitar configuração de notificações desativadas', async () => {
    // Simular notificações desativadas
    emailService.updateConfig({ notificationsEnabled: false });
    
    // Tentar enviar notificação
    const result = await emailService.sendNotificationToUser(
      NotificationTemplate.LOGIN_NEW_DEVICE,
      { username: 'João Silva' },
      { email: 'usuario@empresa.com.br' }
    );
    
    // Verificar que o email não foi enviado
    expect(result).toBe(false);
    
    // Verificar mensagem no console
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('Notificações de email estão desativadas')
    );
  });

  it('deve tratar erros durante o envio', async () => {
    // Forçar um erro no envio
    consoleSpy.log.mockImplementationOnce(() => {
      throw new Error('Erro simulado');
    });
    
    // Tentar enviar notificação
    const result = await emailService.sendNotificationToUser(
      NotificationTemplate.PASSWORD_CHANGED,
      { username: 'João Silva' },
      { email: 'usuario@empresa.com.br' }
    );
    
    // Verificar que o envio falhou
    expect(result).toBe(false);
    
    // Verificar log de erro
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('Erro ao enviar email:'),
      expect.any(Error)
    );
  });
}); 