// Notification service for handling error alerts and other notifications
// Uses a custom event system to trigger UI notifications

export interface NotificationData {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  duration?: number; // in milliseconds
}

class NotificationService {
  private listeners: ((notification: NotificationData) => void)[] = [];

  // Subscribe to notifications
  subscribe(callback: (notification: NotificationData) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Show error notification
  showError(message: string, duration: number = 4000): void {
    this.notify({
      type: 'error',
      message,
      duration
    });
  }

  // Show success notification
  showSuccess(message: string, duration: number = 3000): void {
    this.notify({
      type: 'success',
      message,
      duration
    });
  }

  // Show warning notification
  showWarning(message: string, duration: number = 3000): void {
    this.notify({
      type: 'warning',
      message,
      duration
    });
  }

  // Show info notification
  showInfo(message: string, duration: number = 3000): void {
    this.notify({
      type: 'info',
      message,
      duration
    });
  }

  // Generic notification method
  private notify(notification: NotificationData): void {
    this.listeners.forEach(callback => callback(notification));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();