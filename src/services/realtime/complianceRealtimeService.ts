import { supabase } from '@/integrations/supabase/client';

type SubscriptionCallback = (payload: any) => void;
type ChannelEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * ComplianceRealtimeService
 * 
 * Manages real-time connections and synchronization between UI components
 * and the database using Supabase's real-time channels.
 */
export class ComplianceRealtimeService {
  private static activeChannels: Map<string, any> = new Map();
  private static subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  
  /**
   * Subscribe to real-time updates for a user's requirements
   */
  static subscribeToUserRequirements(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `user-requirements-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to real-time updates for a specific requirement
   */
  static subscribeToRequirement(
    requirementId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `requirement-${requirementId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records',
          filter: `metric_id=eq.${requirementId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to tier changes for a user
   */
  static subscribeToTierChanges(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `user-tier-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Subscribe to compliance statistics changes
   */
  static subscribeToComplianceStats(
    userId: string,
    callback: SubscriptionCallback
  ): () => void {
    const channelKey = `compliance-stats-${userId}`;
    
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }
    
    // Add callback to subscribers
    this.subscriptions.get(channelKey)!.add(callback);
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_compliance_records',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          // Notify all subscribers
          const subscribers = this.subscriptions.get(channelKey) || new Set();
          subscribers.forEach(cb => cb(payload));
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(channelKey);
      
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no subscribers left, remove channel
        if (subscribers.size === 0) {
          const channel = this.activeChannels.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            this.activeChannels.delete(channelKey);
          }
          
          this.subscriptions.delete(channelKey);
        }
      }
    };
  }
  
  /**
   * Broadcast a requirement update to all subscribers
   */
  static broadcastRequirementUpdate(
    userId: string,
    requirementId: string,
    payload: any
  ): void {
    // Notify user requirements subscribers
    const userReqSubscribers = this.subscriptions.get(`user-requirements-${userId}`);
    if (userReqSubscribers) {
      userReqSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'user_compliance_records',
        schema: 'public',
        event: 'UPDATE',
        new: {
          user_id: userId,
          metric_id: requirementId,
          ...payload
        }
      }));
    }
    
    // Notify specific requirement subscribers
    const reqSubscribers = this.subscriptions.get(`requirement-${requirementId}`);
    if (reqSubscribers) {
      reqSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'user_compliance_records',
        schema: 'public',
        event: 'UPDATE',
        new: {
          user_id: userId,
          metric_id: requirementId,
          ...payload
        }
      }));
    }
  }
  
  /**
   * Broadcast a tier update to all subscribers
   */
  static broadcastTierUpdate(
    userId: string,
    payload: any
  ): void {
    // Notify tier subscribers
    const tierSubscribers = this.subscriptions.get(`user-tier-${userId}`);
    if (tierSubscribers) {
      tierSubscribers.forEach(cb => cb({
        type: 'broadcast',
        table: 'profiles',
        schema: 'public',
        event: 'UPDATE',
        new: {
          id: userId,
          ...payload
        }
      }));
    }
  }
  
  /**
   * Subscribe to presence updates to track online users
   */
  static subscribeToPresence(
    channelName: string,
    callback: (presence: any) => void
  ): () => void {
    const channelKey = `presence-${channelName}`;
    
    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      const channel = supabase
        .channel(channelKey)
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          callback(presenceState);
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const channel = this.activeChannels.get(channelKey);
      if (channel) {
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      }
    };
  }
  
  /**
   * Track user presence
   */
  static trackPresence(
    channelName: string,
    userId: string,
    userInfo: any = {}
  ): () => void {
    const channelKey = `presence-${channelName}`;
    
    // Get or create channel
    let channel = this.activeChannels.get(channelKey);
    
    if (!channel) {
      channel = supabase
        .channel(channelKey)
        .on('presence', { event: 'sync' }, () => {
          // Handle presence sync
        })
        .subscribe();
      
      this.activeChannels.set(channelKey, channel);
    }
    
    // Track user
    channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...userInfo
    });
    
    // Return untrack function
    return () => {
      channel.untrack();
    };
  }
  
  /**
   * Close all active channels
   */
  static closeAllChannels(): void {
    this.activeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    
    this.activeChannels.clear();
    this.subscriptions.clear();
  }
}