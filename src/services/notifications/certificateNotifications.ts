
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';
import { apiClient } from '@/api/ApiClient';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    // Add timeout to prevent hanging requests
    const result = await Promise.race([
      apiClient.sendNotification({
        user_id: params.recipientId,
        title: params.title || 'Certificate Notification',
        message: params.message,
        type: params.type || 'INFO',
        action_url: params.actionUrl,
        send_email: params.sendEmail
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]);

    if (result.error) {
      console.error('Error sending notification:', result.error);
      throw result.error;
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    // More descriptive error message
    toast.error(
      error instanceof Error && error.message === 'Request timeout'
        ? 'Network timeout - please try again' 
        : 'Could not send notification'
    );
  }
};
