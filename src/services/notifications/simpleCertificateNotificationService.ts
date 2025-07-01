
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CertificateNotification {
  id: string;
  user_id: string;
  certificate_request_id?: string;
  batch_id?: string;
  notification_type: 'batch_submitted' | 'batch_approved' | 'batch_rejected' | 'certificate_approved' | 'certificate_rejected';
  title: string;
  message: string;
  email_sent: boolean;
  email_sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface CreateCertificateNotificationParams {
  userId: string;
  certificateRequestId?: string;
  batchId?: string;
  notificationType: CertificateNotification['notification_type'];
  title: string;
  message: string;
  sendEmail?: boolean;
}

export class SimpleCertificateNotificationService {
  /**
   * Create a new certificate notification using the database function
   */
  static async createNotification(params: CreateCertificateNotificationParams): Promise<string | null> {
    try {
      console.log('Creating certificate notification via DB function:', params);

      // Use the database function instead of direct insert to avoid RLS issues
      const { data, error } = await supabase.rpc('create_certificate_notification', {
        p_user_id: params.userId,
        p_certificate_request_id: params.certificateRequestId || null,
        p_batch_id: params.batchId || null,
        p_notification_type: params.notificationType,
        p_title: params.title,
        p_message: params.message,
        p_send_email: params.sendEmail !== false
      });

      if (error) {
        console.error('Error creating certificate notification via DB function:', error);
        throw error;
      }

      console.log('Certificate notification created successfully via DB function:', data);
      return data;

    } catch (error) {
      console.error('Failed to create certificate notification:', error);
      // Don't fail the whole process for notification errors - just log and continue
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit: number = 50): Promise<CertificateNotification[]> {
    try {
      const { data, error } = await supabase
        .from('certificate_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching certificate notifications:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to fetch certificate notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('certificate_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('certificate_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Batch notification helpers for certificate workflows
   */
  static async notifyBatchSubmitted(userId: string, batchId: string, batchSize: number): Promise<void> {
    await this.createNotification({
      userId,
      batchId,
      notificationType: 'batch_submitted',
      title: 'Certificate Batch Submitted',
      message: `Your batch of ${batchSize} certificate requests has been submitted for review. You will be notified once the review is complete.`,
      sendEmail: true
    });
  }

  static async notifyBatchApproved(userId: string, batchId: string, approvedCount: number): Promise<void> {
    await this.createNotification({
      userId,
      batchId,
      notificationType: 'batch_approved',
      title: 'Certificate Batch Approved',
      message: `Great news! ${approvedCount} certificates from your batch have been approved and are ready for download.`,
      sendEmail: true
    });
  }

  static async notifyBatchRejected(userId: string, batchId: string, rejectedCount: number, reason?: string): Promise<void> {
    const message = reason 
      ? `${rejectedCount} certificates from your batch were rejected. Reason: ${reason}. Please review and resubmit.`
      : `${rejectedCount} certificates from your batch require attention. Please review the feedback and resubmit.`;

    await this.createNotification({
      userId,
      batchId,
      notificationType: 'batch_rejected',
      title: 'Certificate Batch Requires Attention',
      message,
      sendEmail: true
    });
  }

  static async notifyCertificateApproved(userId: string, certificateRequestId: string, certificateName: string): Promise<void> {
    await this.createNotification({
      userId,
      certificateRequestId,
      notificationType: 'certificate_approved',
      title: 'Certificate Approved',
      message: `Your certificate "${certificateName}" has been approved and is ready for download.`,
      sendEmail: true
    });
  }

  static async notifyCertificateRejected(userId: string, certificateRequestId: string, certificateName: string, reason?: string): Promise<void> {
    const message = reason 
      ? `Your certificate "${certificateName}" was rejected. Reason: ${reason}. Please review and resubmit.`
      : `Your certificate "${certificateName}" requires revision. Please check the details and resubmit.`;

    await this.createNotification({
      userId,
      certificateRequestId,
      notificationType: 'certificate_rejected',
      title: 'Certificate Requires Revision',
      message,
      sendEmail: true
    });
  }

  /**
   * Notify administrators about batch submissions - with proper error handling
   */
  static async notifyAdminsOfBatchSubmission(batchId: string, submitterName: string, batchSize: number): Promise<void> {
    try {
      console.log('Starting admin notification process...');
      
      // Get admin users with proper query construction
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('role', ['AD', 'SA'])
        .not('email', 'is', null);

      if (error) {
        console.error('Error fetching admin users:', error);
        // Don't throw - this shouldn't break the batch upload
        return;
      }

      if (!adminUsers || adminUsers.length === 0) {
        console.warn('No admin users found for batch notification');
        return;
      }

      console.log(`Found ${adminUsers.length} admin users for notification`);

      // Create notifications for each admin - with error handling for each
      const notificationPromises = adminUsers.map(async (admin) => {
        try {
          return await this.createNotification({
            userId: admin.id,
            batchId,
            notificationType: 'batch_submitted',
            title: 'New Certificate Batch Submitted',
            message: `${submitterName} has submitted a batch of ${batchSize} certificate requests for review.`,
            sendEmail: true
          });
        } catch (error) {
          console.error(`Failed to notify admin ${admin.id}:`, error);
          // Return null instead of throwing to continue with other notifications
          return null;
        }
      });

      const results = await Promise.allSettled(notificationPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      
      console.log(`Successfully notified ${successCount} out of ${adminUsers.length} administrators about batch submission`);

    } catch (error) {
      console.error('Failed to notify administrators:', error);
      // Don't throw - this shouldn't block the main workflow
    }
  }
}
