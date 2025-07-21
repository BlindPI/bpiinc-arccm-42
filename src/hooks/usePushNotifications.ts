import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateNotificationPreferences } from '@/hooks/useNotifications';

export interface BrowserNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const updatePreferences = useUpdateNotificationPreferences();
  
  const [state, setState] = useState<BrowserNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    checkBrowserNotificationSupport();
  }, []);

  const checkBrowserNotificationSupport = async () => {
    try {
      const isSupported = 'Notification' in window;
      const permission = isSupported ? Notification.permission : 'denied';
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission,
        isSubscribed: permission === 'granted',
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to check notification support',
        isLoading: false
      }));
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Browser notifications not supported' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isSubscribed: permission === 'granted',
        isLoading: false
      }));

      // Update user preferences to enable browser notifications for all categories
      if (permission === 'granted' && user?.id) {
        const categories = ['CERTIFICATE', 'COURSE', 'ACCOUNT', 'SYSTEM'];
        
        await Promise.all(
          categories.map(category =>
            updatePreferences.mutateAsync({
              category,
              updates: {
                in_app_enabled: true,
                email_enabled: true,
                browser_enabled: true
              }
            })
          )
        );
      }

      return permission === 'granted';
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to request notification permission',
        isLoading: false
      }));
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (state.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } else {
      console.warn('Cannot show notification: permission not granted');
      return null;
    }
  };

  const testNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from your notification system.',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
  };

  const disableBrowserNotifications = async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Update user preferences to disable browser notifications
      const categories = ['CERTIFICATE', 'COURSE', 'ACCOUNT', 'SYSTEM'];
      
      await Promise.all(
        categories.map(category =>
          updatePreferences.mutateAsync({
            category,
            updates: {
              in_app_enabled: true,
              email_enabled: true,
              browser_enabled: false
            }
          })
        )
      );

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to disable browser notifications',
        isLoading: false
      }));
    }
  };

  return {
    ...state,
    requestPermission,
    showNotification,
    testNotification,
    disableBrowserNotifications,
    refresh: checkBrowserNotificationSupport
  };
}

/**
 * Hook to automatically show browser notifications for new notifications
 */
export function useAutoBrowserNotifications() {
  const pushNotifications = usePushNotifications();

  const showNotificationFromData = (notification: {
    title: string;
    message: string;
    category?: string;
    action_url?: string;
  }) => {
    if (pushNotifications.permission === 'granted') {
      const notif = pushNotifications.showNotification(notification.title, {
        body: notification.message,
        tag: `notification-${Date.now()}`,
        data: {
          category: notification.category,
          action_url: notification.action_url
        }
      });

      // Handle notification click
      if (notif) {
        notif.onclick = () => {
          if (notification.action_url) {
            window.open(notification.action_url, '_blank');
          }
          notif.close();
        };
      }

      return notif;
    }
    return null;
  };

  return {
    ...pushNotifications,
    showNotificationFromData
  };
}