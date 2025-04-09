
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    // Add timeout to prevent hanging requests
    const result = await Promise.race([
      supabase.functions.invoke('send-notification', {
        body: {
          userId: params.recipientId,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          title: params.title || 'Certificate Notification',
          message: params.message,
          type: params.type || 'INFO',
          actionUrl: params.actionUrl,
          sendEmail: params.sendEmail !== false, // Default to true
          courseName: params.courseName,
          rejectionReason: params.rejectionReason
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]);

    if (result.error) {
      console.error('Error sending notification:', result.error);
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to send notification:', error);
    // More descriptive error message
    toast.error(
      error instanceof Error && error.message === 'Request timeout'
        ? 'Network timeout - please try again' 
        : 'Could not send notification'
    );
    throw error;
  }
};

// Function to manually process the notification queue
export const processNotificationQueue = async () => {
  try {
    const result = await supabase.functions.invoke('process-notifications', {
      body: { processQueue: true }
    });
    
    if (result.error) {
      console.error('Error processing notification queue:', result.error);
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to process notification queue:', error);
    toast.error('Could not process notification queue');
    throw error;
  }
};

// Function to create a notification without sending an email
export const createNotification = async (params: {
  userId: string;
  title: string;
  message: string;
  type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  actionUrl?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        action_url: params.actionUrl,
        read: false
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};
