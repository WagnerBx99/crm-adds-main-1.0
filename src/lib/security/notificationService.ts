// Notification Service for security alerts

export interface SecurityNotification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface NotificationOptions {
  persistent?: boolean;
  duration?: number;
  action?: () => void;
}

class NotificationService {
  private notifications: SecurityNotification[] = [];

  addNotification(
    type: SecurityNotification['type'],
    title: string,
    message: string,
    options?: NotificationOptions
  ): SecurityNotification {
    const notification: SecurityNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    
    this.notifications.push(notification);
    return notification;
  }

  getNotifications(): SecurityNotification[] {
    return [...this.notifications];
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  clearAll(): void {
    this.notifications = [];
  }

  warn(title: string, message: string, options?: NotificationOptions): SecurityNotification {
    return this.addNotification('warning', title, message, options);
  }

  error(title: string, message: string, options?: NotificationOptions): SecurityNotification {
    return this.addNotification('error', title, message, options);
  }

  info(title: string, message: string, options?: NotificationOptions): SecurityNotification {
    return this.addNotification('info', title, message, options);
  }

  success(title: string, message: string, options?: NotificationOptions): SecurityNotification {
    return this.addNotification('success', title, message, options);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
