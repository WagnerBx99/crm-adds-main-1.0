import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SecurityNotifications from '@/components/security/SecurityNotifications';

// Mock do serviço de notificações
vi.mock('@/lib/security/notificationService', () => {
  return {
    notificationService: {
      getNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      clearAllNotifications: vi.fn()
    }
  };
});

// Importar mock após o mock ser definido
import { notificationService } from '@/lib/security/notificationService';

describe('SecurityNotifications', () => {
  const mockUserId = 'user123';
  
  // Dados de teste
  const mockNotifications = [
    {
      id: '1',
      timestamp: Date.now(),
      userId: 'user123',
      title: 'Alerta Crítico',
      message: 'Tentativa de acesso não autorizado',
      template: 'SUSPICIOUS_ACTIVITY',
      priority: 'critical',
      read: false,
      channels: ['in-app']
    },
    {
      id: '2',
      timestamp: Date.now() - 3600000, // 1 hora atrás
      userId: 'user123',
      title: 'Senha Alterada',
      message: 'Sua senha foi alterada com sucesso',
      template: 'PASSWORD_CHANGED',
      priority: 'medium',
      read: true,
      channels: ['in-app', 'email']
    }
  ];
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Configurar mocks
    (notificationService.getNotifications as any).mockReturnValue(mockNotifications);
    (notificationService.getUnreadCount as any).mockReturnValue(1);
  });
  
  it('deve renderizar corretamente com contagem de não lidas', () => {
    render(<SecurityNotifications userId={mockUserId} />);
    
    // Verificar se o ícone de notificação é exibido
    expect(screen.getByLabelText('Notificações de segurança')).toBeInTheDocument();
    
    // Verificar se a contagem de não lidas é exibida
    expect(screen.getByText('1')).toBeInTheDocument();
  });
  
  it('deve abrir o dropdown ao clicar no ícone', async () => {
    render(<SecurityNotifications userId={mockUserId} />);
    
    // Clicar no ícone de notificação
    fireEvent.click(screen.getByLabelText('Notificações de segurança'));
    
    // Verificar se o dropdown é exibido
    await waitFor(() => {
      expect(screen.getByText('Notificações de Segurança')).toBeInTheDocument();
    });
    
    // Verificar se as notificações são exibidas
    expect(screen.getByText('Alerta Crítico')).toBeInTheDocument();
    expect(screen.getByText('Senha Alterada')).toBeInTheDocument();
  });
  
  it('deve marcar notificação como lida ao clicar', async () => {
    // Mock da função de marcação
    (notificationService.markAsRead as any).mockReturnValue(true);
    
    // Mock da função de callback
    const mockOnClick = vi.fn();
    
    render(
      <SecurityNotifications 
        userId={mockUserId} 
        onNotificationClick={mockOnClick} 
      />
    );
    
    // Abrir dropdown
    fireEvent.click(screen.getByLabelText('Notificações de segurança'));
    
    // Clicar na notificação não lida
    await waitFor(() => {
      fireEvent.click(screen.getByText('Alerta Crítico'));
    });
    
    // Verificar se a função foi chamada
    expect(notificationService.markAsRead).toHaveBeenCalledWith(mockUserId, '1');
    expect(mockOnClick).toHaveBeenCalledWith(mockNotifications[0]);
  });
  
  it('deve marcar todas como lidas', async () => {
    // Mock da função
    (notificationService.markAllAsRead as any).mockReturnValue(2);
    
    render(<SecurityNotifications userId={mockUserId} />);
    
    // Abrir dropdown
    fireEvent.click(screen.getByLabelText('Notificações de segurança'));
    
    // Clicar no botão de marcar todas como lidas
    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Marcar todas como lidas'));
    });
    
    // Verificar se a função foi chamada
    expect(notificationService.markAllAsRead).toHaveBeenCalledWith(mockUserId);
  });
  
  it('deve limpar todas as notificações', async () => {
    // Mock da função
    (notificationService.clearAllNotifications as any).mockReturnValue(2);
    
    render(<SecurityNotifications userId={mockUserId} />);
    
    // Abrir dropdown
    fireEvent.click(screen.getByLabelText('Notificações de segurança'));
    
    // Clicar no botão de limpar todas
    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Limpar todas'));
    });
    
    // Verificar se a função foi chamada
    expect(notificationService.clearAllNotifications).toHaveBeenCalledWith(mockUserId);
  });
  
  it('deve exibir mensagem quando não há notificações', async () => {
    // Mock para retornar lista vazia
    (notificationService.getNotifications as any).mockReturnValue([]);
    (notificationService.getUnreadCount as any).mockReturnValue(0);
    
    render(<SecurityNotifications userId={mockUserId} />);
    
    // Abrir dropdown
    fireEvent.click(screen.getByLabelText('Notificações de segurança'));
    
    // Verificar mensagem
    await waitFor(() => {
      expect(screen.getByText('Nenhuma notificação de segurança')).toBeInTheDocument();
    });
  });
});