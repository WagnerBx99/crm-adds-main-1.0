import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { notificationService, Notification } from '@/lib/services/notificationService';
import { userService } from '@/lib/services/userService';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();

    const loadNotifications = () => {
      if (currentUser?.id) {
        const userNotifications = notificationService.getNotifications(currentUser.id);
        setNotifications(userNotifications);
        setUnreadCount(notificationService.getUnreadCount(currentUser.id));
      }
    };
    loadNotifications();

    // Conectar ao WebSocket
    if (currentUser?.id) {
      notificationService.connectWebSocket(currentUser.id);
    }

    return () => {
      notificationService.disconnectWebSocket();
    };
  }, [currentUser?.id]);

  const handleMarkAsRead = (notificationId: string) => {
    if (currentUser?.id) {
      notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = () => {
    if (currentUser?.id) {
      notificationService.markAllAsRead(currentUser.id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    if (currentUser?.id) {
      notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <X className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.link && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => window.location.href = notification.link!}
                        >
                          Ver detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {notifications.length > 0 && (
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 