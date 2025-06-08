
export class ServiceWorkerService {
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateAvailable();
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }
  
  static async checkForUpdates(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }
  
  private static showUpdateAvailable(): void {
    // Show notification that app update is available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of the app is available. Refresh to update.',
        icon: '/android-chrome-192x192.png'
      });
    }
  }
  
  static async enablePushNotifications(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
          )
        });
        
        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
        return true;
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
    
    return false;
  }
  
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
  
  private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send push subscription to your backend
    console.log('Push subscription:', subscription);
  }
  
  static async getOfflineCapabilities(): Promise<{
    canWorkOffline: boolean;
    cachedResources: string[];
  }> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const cachedResources: string[] = [];
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          cachedResources.push(...requests.map(req => req.url));
        }
        
        return {
          canWorkOffline: cachedResources.length > 0,
          cachedResources
        };
      } catch (error) {
        console.error('Error checking offline capabilities:', error);
      }
    }
    
    return {
      canWorkOffline: false,
      cachedResources: []
    };
  }
}

// Auto-register service worker
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    ServiceWorkerService.register();
  });
}
