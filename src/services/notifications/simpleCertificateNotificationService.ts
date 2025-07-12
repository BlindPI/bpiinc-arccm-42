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
  read: boolean;
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
   * Create a new certificate notification
   */
  static async createNotification(params: CreateCertificateNotificationParams): Promise<string | null> {
    try {
      console.log('Creating certificate notification:', params);

      // Direct insert since the RPC function isn't in the types yet
      const { data, error } = await supabase
        .from('certificate_notifications')
        .insert({
          user_id: params.userId,
          certificate_request_id: params.certificateRequestId || null,
          batch_id: params.batchId || null,
          notification_type: params.notificationType,
          title: params.title,
          message: params.message
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating certificate notification:', error);
        throw error;
      }

      // Send email if requested
      if (params.sendEmail !== false) {
        try {
          await supabase.functions.invoke('send-certificate-notification-email', {
            body: {
              notification_id: data.id,
              user_email: params.userId, // Will be resolved in the function
              title: params.title,
              message: params.message,
              notification_type: params.notificationType
            }
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the notification creation if email fails
        }
      }

      console.log('Certificate notification created successfully:', data.id);
      return data.id;

    } catch (error) {
      console.error('Failed to create certificate notification:', error);
      toast.error('Failed to send notification');
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

      return (data || []) as CertificateNotification[];

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
   * Notify administrators about batch submissions
   */
  static async notifyAdminsOfBatchSubmission(batchId: string, submitterName: string, batchSize: number): Promise<void> {
    try {
      // Get admin users
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('role', ['AD', 'SA']);

      if (error || !adminUsers?.length) {
        console.warn('No admin users found for batch notification');
        return;
      }

      // Create notifications for each admin
      const notifications = adminUsers.map(admin => 
        this.createNotification({
          userId: admin.id,
          batchId,
          notificationType: 'batch_submitted',
          title: 'New Certificate Batch Submitted',
          message: `${submitterName} has submitted a batch of ${batchSize} certificate requests for review.`,
          sendEmail: true
        })
      );

      await Promise.all(notifications);
      console.log(`Notified ${adminUsers.length} administrators about batch submission`);

    } catch (error) {
      console.error('Failed to notify administrators:', error);
      // Don't throw - this shouldn't block the main workflow
    }
  }
}