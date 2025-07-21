import { supabase } from '@/integrations/supabase/client';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  /**
   * Check if push notifications are supported in the browser
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission from the user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    console.log('Push notification permission:', permission);
    return permission;
  }

  /**
   * Register service worker for push notifications
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Register service worker
      const registration = await this.registerServiceWorker();

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        if (!this.VAPID_PUBLIC_KEY) {
          throw new Error('VAPID public key not configured');
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
        });
      }

      // Save subscription to database
      await this.saveSubscription(userId, subscription);
      
      console.log('Push notification subscription successful:', subscription);
      return subscription;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        console.log('No service worker registration found');
        return true;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        console.log('No push subscription found');
        return true;
      }

      // Unsubscribe from push manager
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // Remove subscription from database
        await this.removeSubscription(userId);
        console.log('Successfully unsubscribed from push notifications');
      }

      return unsubscribed;

    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  static async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) return false;
      
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) return false;
      
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;

    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Save push subscription to database
   */
  private static async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: Buffer.from(subscription.getKey('p256dh')!).toString('base64'),
        auth: Buffer.from(subscription.getKey('auth')!).toString('base64')
      }
    };

    const { error } = await supabase
      .from('push_subscriptions' as any)
      .upsert({
        user_id: userId,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys.p256dh,
        auth_key: subscriptionData.keys.auth,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription from database
   */
  private static async removeSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID public key from base64 to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Send a test push notification
   */
  static async sendTestNotification(userId: string, title: string, message: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          message,
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Failed to send test push notification:', error);
        throw error;
      }

      console.log('Test push notification sent successfully');

    } catch (error) {
      console.error('Error sending test push notification:', error);
      throw error;
    }
  }
}