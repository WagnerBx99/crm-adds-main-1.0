import React, { useState, useEffect, useRef } from 'react';
import { 
  LogEventType,
  LogSeverity
} from '@/lib/security/logService';
import { Bell, BellOff, Check, CheckCheck, Trash2, X } from 'lucide-react';

// Definições de tipos até que o notificationService seja reconhecido
interface SecurityNotification {
  id: string;
  timestamp: number;
  userId?: string;
  username?: string;
  template: string;
  channels: string[];
  title: string;
  message: string;
  data?: any;
  read?: boolean;
  readTimestamp?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: number;
}

enum NotificationTemplate {
  LOGIN_NEW_DEVICE = 'LOGIN_NEW_DEVICE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_SETTING_CHANGED = 'SECURITY_SETTING_CHANGED',
  DATA_EXPORT = 'DATA_EXPORT',
  ADMIN_ACTION_SUMMARY = 'ADMIN_ACTION_SUMMARY'
}

// Mock do serviço de notificações até integração completa
const notificationService = {
  getNotifications: (userId: string): SecurityNotification[] => [],
  getUnreadCount: (userId: string): number => 0,
  markAsRead: (userId: string, notificationId: string): boolean => true,
  markAllAsRead: (userId: string): number => 0,
  clearAllNotifications: (userId: string): number => 0
};

interface SecurityNotificationsProps {
  userId: string;
  onNotificationClick?: (notification: SecurityNotification) => void;
}

export function SecurityNotifications({ userId, onNotificationClick }: SecurityNotificationsProps) {
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [newNotification, setNewNotification] = useState<SecurityNotification | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Carregar notificações ao montar o componente
  useEffect(() => {
    loadNotifications();
    
    // Registrar listener para novas notificações
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<SecurityNotification>;
      if (customEvent.detail.userId === userId || !customEvent.detail.userId) {
        handleNotificationReceived(customEvent.detail);
      }
    };
    
    document.addEventListener('securityNotification', handleNewNotification);
    
    // Cleanup
    return () => {
      document.removeEventListener('securityNotification', handleNewNotification);
    };
  }, [userId]);
  
  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Carregar notificações do usuário
  const loadNotifications = () => {
    const userNotifications = notificationService.getNotifications(userId);
    const unread = notificationService.getUnreadCount(userId);
    
    setNotifications(userNotifications);
    setUnreadCount(unread);
  };
  
  // Alternar exibição do dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Manipular clique em notificação
  const handleNotificationClick = (notification: SecurityNotification) => {
    if (!notification.read) {
      notificationService.markAsRead(userId, notification.id);
      loadNotifications();
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };
  
  // Manipular recebimento de nova notificação
  const handleNotificationReceived = (notification: SecurityNotification) => {
    // Atualizar lista de notificações
    loadNotifications();
    
    // Mostrar toast para notificação de alta prioridade
    if (notification.priority === 'high' || notification.priority === 'critical') {
      setNewNotification(notification);
      setShowToast(true);
      
      // Auto-esconder toast após 8 segundos
      setTimeout(() => {
        setShowToast(false);
      }, 8000);
    }
  };
  
  // Marcar todas como lidas
  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAllAsRead(userId);
    loadNotifications();
  };
  
  // Limpar todas as notificações
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.clearAllNotifications(userId);
    loadNotifications();
    setIsOpen(false);
  };
  
  // Obter cor de prioridade
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };
  
  // Obter ícone para o template
  const getTemplateIcon = (template: string) => {
    switch (template) {
      case NotificationTemplate.CRITICAL_ERROR:
      case NotificationTemplate.SUSPICIOUS_ACTIVITY:
        return <span className="text-red-600 text-xl">&#9888;</span>;
      case NotificationTemplate.SECURITY_SETTING_CHANGED:
      case NotificationTemplate.PERMISSION_CHANGED:
        return <span className="text-blue-600 text-xl">&#128274;</span>;
      case NotificationTemplate.PASSWORD_CHANGED:
      case NotificationTemplate.ACCOUNT_LOCKED:
        return <span className="text-orange-600 text-xl">&#128273;</span>;
      default:
        return <span className="text-gray-600 text-xl">&#9432;</span>;
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de notificações */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notificações de segurança"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="h-6 w-6 text-gray-700" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellOff className="h-6 w-6 text-gray-500" />
        )}
      </button>
      
      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 w-96 max-h-[70vh] overflow-y-auto mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold text-lg">Notificações de Segurança</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-5 w-5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-800 p-1 rounded"
                  title="Limpar todas"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma notificação de segurança</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getTemplateIcon(notification.template)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-blue-800' : 'text-gray-800'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="mt-1 flex justify-between items-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(notification.priority)} capitalize`}>
                          {notification.priority === 'critical' ? 'Crítico' :
                           notification.priority === 'high' ? 'Alta' :
                           notification.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        {notification.read ? (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Lida
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* Toast para notificações importantes */}
      {showToast && newNotification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border-l-4 z-50 w-96 ${getPriorityColor(newNotification.priority)}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center">
                {getTemplateIcon(newNotification.template)}
                <h4 className="ml-2 font-bold">{newNotification.title}</h4>
              </div>
              <p className="mt-1 text-sm">{newNotification.message}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityNotifications; 