import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row'];
type NotificationDeliveryLog = Database['public']['Tables']['notification_delivery_log']['Row'];
type WebhookConfiguration = Database['public']['Tables']['webhook_configurations']['Row'];

export interface NotificationEvent {
  type: string;
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  byMethod: Record<string, number>;
}

export class NotificationService {
  /**
   * Get user's notification preferences
   */
  static async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update notification preference
   */
  static async updatePreference(preference: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(preference as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete notification preference
   */
  static async deletePreference(preferenceId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('id', preferenceId);

    if (error) throw error;
  }

  /**
   * Send notification
   */
  static async sendNotification(notification: NotificationEvent): Promise<{ success: boolean; messageIds: string[] }> {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: notification
    });

    if (error) throw error;
    return data;
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(notifications: NotificationEvent[]): Promise<{ success: number; failed: number }> {
    const { data, error } = await supabase.functions.invoke('send-bulk-notifications', {
      body: { notifications }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get notification delivery logs
   */
  static async getDeliveryLogs(userId: string, options?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<NotificationDeliveryLog[]> {
    let query = supabase
      .from('notification_delivery_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get notification statistics
   */
  static async getStats(userId: string, days: number = 30): Promise<NotificationStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('notification_delivery_log')
      .select('status, delivery_method')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const logs = data || [];
    const stats: NotificationStats = {
      total: logs.length,
      sent: logs.filter(log => log.status !== 'pending').length,
      delivered: logs.filter(log => log.status === 'delivered').length,
      failed: logs.filter(log => ['failed', 'bounced'].includes(log.status)).length,
      byMethod: {}
    };

    // Group by delivery method
    logs.forEach(log => {
      stats.byMethod[log.delivery_method] = (stats.byMethod[log.delivery_method] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get webhook configurations
   */
  static async getWebhooks(userId?: string, teamId?: string): Promise<WebhookConfiguration[]> {
    let query = supabase.from('webhook_configurations').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Create webhook configuration
   */
  static async createWebhook(webhook: Partial<WebhookConfiguration>): Promise<WebhookConfiguration> {
    const { data, error } = await supabase
      .from('webhook_configurations')
      .insert(webhook as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhook(webhookId: string, updates: Partial<WebhookConfiguration>): Promise<void> {
    const { error } = await supabase
      .from('webhook_configurations')
      .update(updates)
      .eq('id', webhookId);

    if (error) throw error;
  }

  /**
   * Delete webhook configuration
   */
  static async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_configurations')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(webhookId: string): Promise<{ success: boolean; status?: number; error?: string }> {
    const { data, error } = await supabase.functions.invoke('test-webhook', {
      body: { webhook_id: webhookId }
    });

    if (error) return { success: false, error: error.message };
    return data;
  }

  /**
   * Trigger webhook manually
   */
  static async triggerWebhook(webhookId: string, eventData: Record<string, any>): Promise<void> {
    const { error } = await supabase.functions.invoke('trigger-webhook', {
      body: {
        webhook_id: webhookId,
        event_data: eventData
      }
    });

    if (error) throw error;
  }

  /**
   * Set default notification preferences for user
   */
  static async setDefaultPreferences(userId: string): Promise<void> {
    const defaultPreferences = [
      {
        user_id: userId,
        notification_type: 'availability_change',
        enabled: true,
        delivery_method: 'email' as const,
        settings: { immediate: true }
      },
      {
        user_id: userId,
        notification_type: 'calendar_conflict',
        enabled: true,
        delivery_method: 'email' as const,
        settings: { immediate: true }
      },
      {
        user_id: userId,
        notification_type: 'team_update',
        enabled: true,
        delivery_method: 'email' as const,
        settings: { immediate: false, daily_digest: true }
      },
      {
        user_id: userId,
        notification_type: 'booking_reminder',
        enabled: true,
        delivery_method: 'email' as const,
        settings: { advance_hours: 24 }
      }
    ];

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(defaultPreferences);

    if (error) throw error;
  }

  /**
   * Send test notification
   */
  static async sendTestNotification(userId: string, deliveryMethod: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('send-test-notification', {
      body: {
        user_id: userId,
        delivery_method: deliveryMethod
      }
    });

    if (error) return { success: false, error: error.message };
    return data;
  }
}