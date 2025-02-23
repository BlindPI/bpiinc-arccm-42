
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

type NotificationResponse = {
  error?: { message: string } | null;
};

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    // Add timeout to prevent hanging requests
    const result = await Promise.race([
      supabase.functions.invoke<NotificationResponse>('send-notification', {
        body: params
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]) as NotificationResponse;

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
        : 'Could not send notification email'
    );
  }
};
