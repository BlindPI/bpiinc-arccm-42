import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';
import { supabase } from '@/integrations/supabase/client';

export async function createTestNotifications() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('Creating test notifications for user:', user.id);

    // Create a few test notifications
    const testNotifications = [
      {
        userId: user.id,
        notificationType: 'certificate_approved' as const,
        title: 'Certificate Approved',
        message: 'Your CPR Level C certificate has been approved and is ready for download.',
        sendEmail: false
      },
      {
        userId: user.id,
        notificationType: 'batch_submitted' as const,
        title: 'Certificate Batch Submitted',
        message: 'Your batch of 3 certificate requests has been submitted for review.',
        sendEmail: false
      },
      {
        userId: user.id,
        notificationType: 'certificate_rejected' as const,
        title: 'Certificate Requires Revision',
        message: 'Your First Aid Basic certificate requires some revisions. Please check the details and resubmit.',
        sendEmail: false
      }
    ];

    // Create notifications
    const results = await Promise.all(
      testNotifications.map(notification => 
        SimpleCertificateNotificationService.createNotification(notification)
      )
    );

    console.log('Test notifications created:', results);
    return results;

  } catch (error) {
    console.error('Failed to create test notifications:', error);
    throw error;
  }
}

export async function clearTestNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Delete all certificate notifications for the current user
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('category', 'CERTIFICATE');

    if (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }

    console.log('Test notifications cleared');

  } catch (error) {
    console.error('Failed to clear test notifications:', error);
    throw error;
  }
}