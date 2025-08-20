import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationService, Notification } from '@/lib/services/notificationService';
import { userService } from '@/lib/services/userService';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = userService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadNotifications(user.id);
      
      // Conectar ao WebSocket para notificações em tempo real
      notificationService.connectWebSocket();
      
      // Simular recebimento de notificações a cada 30 segundos (apenas para demonstração)
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% de chance de receber uma notificação
          const demoNotification = generateRandomNotification(user.id);
          setNotifications(prev => [demoNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }, 30000);
      
      return () => {
        clearInterval(interval);
        notificationService.disconnectWebSocket();
      };
    }
  }, []);

  const loadNotifications = (userId: string) => {
    const userNotifications = notificationService.getNotifications(userId);
    setNotifications(userNotifications);
    setUnreadCount(notificationService.getUnreadCount(userId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    if (currentUser) {
      const count = notificationService.markAllAsRead(currentUser.id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
    notificationService.deleteNotification(notificationId);
    setNotifications(notifications.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleClearAll = () => {
    if (currentUser) {
      notificationService.clearAllNotifications(currentUser.id);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const generateRandomNotification = (userId: string): Notification => {
    const types = ['info', 'success', 'warning', 'error'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const titles = [
      'Novo pedido criado',
      'Status atualizado',
      'Comentário adicionado',
      'Prazo se aproximando'
    ];
    
    return {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      title: titles[Math.floor(Math.random() * titles.length)],
      message: 'Esta é uma notificação de demonstração gerada automaticamente.',
      type,
      read: false,
      createdAt: new Date(),
      link: '#'
    };
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seg atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />;
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={handleClearAll}
              >
                Limpar todas
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start p-3 cursor-default",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium">{notification.title}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 ml-4">
                    {notification.message}
                  </p>
                  <div className="flex justify-between w-full mt-2 ml-4">
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                      {notification.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          asChild
                        >
                          <a href={notification.link}>Ver detalhes</a>
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a 
            href="/settings?category=notifications" 
            className="flex justify-center py-2 text-sm font-medium text-primary"
            onClick={() => setIsOpen(false)}
          >
            Configurações de notificações
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 