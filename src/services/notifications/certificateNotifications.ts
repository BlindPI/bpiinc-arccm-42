
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    // Add timeout to prevent hanging requests
    const result = await Promise.race([
      supabase.functions.invoke('send-notification', {
        body: {
          user_id: params.recipientId,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          title: params.title || 'Certificate Notification',
          message: params.message,
          type: params.type || 'INFO',
          action_url: params.actionUrl,
          send_email: params.sendEmail,
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
