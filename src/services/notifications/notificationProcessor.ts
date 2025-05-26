
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationProcessingResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export class NotificationProcessor {
  static async processNotificationQueue(): Promise<NotificationProcessingResult> {
    try {
      console.log('Starting notification queue processing...');
      
      // Get pending notifications from queue
      const { data: queueItems, error: queueError } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(50);

      if (queueError) {
        throw new Error(`Failed to fetch queue: ${queueError.message}`);
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('No pending notifications to process');
        return { processed: 0, successful: 0, failed: 0, errors: [] };
      }

      console.log(`Processing ${queueItems.length} notifications...`);

      const result: NotificationProcessingResult = {
        processed: queueItems.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Process each notification
      for (const item of queueItems) {
        try {
          // Get the actual notification details
          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', item.notification_id)
            .single();

          if (notifError || !notification) {
            throw new Error(`Notification not found: ${item.notification_id}`);
          }

          // Call edge function to send email
          const { error: sendError } = await supabase.functions.invoke('send-notification', {
            body: {
              notification: {
                id: notification.id,
                user_id: notification.user_id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                category: notification.category,
                send_email: true
              }
            }
          });

          if (sendError) {
            throw new Error(`Failed to send: ${sendError.message}`);
          }

          // Mark as sent
          await supabase
            .from('notification_queue')
            .update({
              status: 'SENT',
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          result.successful++;
          console.log(`Successfully processed notification ${item.notification_id}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Mark as failed
          await supabase
            .from('notification_queue')
            .update({
              status: 'FAILED',
              error: errorMessage,
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          result.failed++;
          result.errors.push({ id: item.notification_id, error: errorMessage });
          console.error(`Failed to process notification ${item.notification_id}:`, error);
        }
      }

      console.log(`Processing complete. Success: ${result.successful}, Failed: ${result.failed}`);
      return result;

    } catch (error) {
      console.error('Notification processing error:', error);
      throw error;
    }
  }

  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    category?: string;
    priority?: string;
    actionUrl?: string;
    sendEmail?: boolean;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Create notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
          category: params.category || 'GENERAL',
          priority: params.priority || 'NORMAL',
          action_url: params.actionUrl,
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (notifError) {
        throw new Error(`Failed to create notification: ${notifError.message}`);
      }

      // Add to queue if email should be sent
      if (params.sendEmail) {
        const { error: queueError } = await supabase
          .from('notification_queue')
          .insert({
            notification_id: notification.id,
            status: 'PENDING',
            priority: params.priority || 'NORMAL',
            category: params.category || 'GENERAL'
          });

        if (queueError) {
          console.error('Failed to add to notification queue:', queueError);
        }
      }

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getQueueStatus() {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const counts = {
      PENDING: 0,
      SENT: 0,
      FAILED: 0,
      SKIPPED: 0
    };

    data?.forEach(item => {
      if (counts.hasOwnProperty(item.status)) {
        counts[item.status as keyof typeof counts]++;
      }
    });

    return counts;
  }
}
