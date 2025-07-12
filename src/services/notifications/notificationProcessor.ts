
import { supabase } from '@/integrations/supabase/client';

export interface NotificationProcessingResult {
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export class NotificationProcessor {
  static async processNotificationQueue(): Promise<NotificationProcessingResult> {
    console.log('🔄 Starting notification processing using edge function...');
    
    try {
      // Use the existing process-notifications edge function
      const { data, error } = await supabase.functions.invoke('process-notifications', {
        body: { batchSize: 50 }
      });

      if (error) {
        console.error('❌ Error processing notifications:', error);
        throw new Error(`Failed to process notifications: ${error.message}`);
      }

      console.log('✅ Notification processing completed:', data);
      
      return {
        processed: data?.processed || 0,
        successful: data?.successful || 0,
        failed: data?.failed || 0,
        results: data?.results || []
      };
    } catch (error) {
      console.error('❌ Unexpected error in notification processing:', error);
      throw error;
    }
  }

  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    category?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    actionUrl?: string;
    metadata?: Record<string, any>;
    sendEmail?: boolean;
  }): Promise<void> {
    console.log('📝 Creating notification for user:', params.userId);

    try {
      // Create notification in notifications table
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
          category: params.category || 'GENERAL',
          priority: params.priority || 'NORMAL',
          action_url: params.actionUrl,
          metadata: params.metadata || {},
          read: false
        })
        .select()
        .single();

      if (notificationError) {
        console.error('❌ Error creating notification:', notificationError);
        throw new Error(`Failed to create notification: ${notificationError.message}`);
      }

      console.log('✅ Notification created successfully');

      // Send email if requested using edge function
      if (params.sendEmail) {
        const { error: emailError } = await supabase.functions.invoke('send-notification', {
          body: {
            userId: params.userId,
            title: params.title,
            message: params.message,
            type: params.type || 'INFO',
            category: params.category || 'GENERAL',
            priority: params.priority || 'NORMAL'
          }
        });

        if (emailError) {
          console.warn('⚠️ Email sending failed but notification was created:', emailError);
        } else {
          console.log('📬 Email sent successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error in createNotification:', error);
      throw error;
    }
  }

  static async getQueueStatus() {
    console.log('📊 Getting notification status from compliance queue...');
    
    try {
      // Use compliance_notification_queue which actually exists
      const { data: queueItems, error } = await supabase
        .from('compliance_notification_queue')
        .select('status, priority')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('❌ Error getting queue status:', error);
        // Return default status if compliance queue is not accessible
        return {
          PENDING: 0,
          SENT: 0,
          FAILED: 0,
          SKIPPED: 0
        };
      }

      const statusCounts = queueItems?.reduce((acc: Record<string, number>, item: any) => {
        const status = item.status || 'PENDING';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        PENDING: statusCounts.PENDING || 0,
        SENT: statusCounts.SENT || 0,
        FAILED: statusCounts.FAILED || 0,
        SKIPPED: statusCounts.SKIPPED || 0
      };
    } catch (error) {
      console.error('❌ Error getting queue status:', error);
      // Return default status on error
      return {
        PENDING: 0,
        SENT: 0,
        FAILED: 0,
        SKIPPED: 0
      };
    }
  }
}
