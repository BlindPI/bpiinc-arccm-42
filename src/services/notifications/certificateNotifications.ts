
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    // Add timeout to prevent hanging requests
    const { error } = await Promise.race([
      supabase.functions.invoke('send-notification', {
        body: params
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]);

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    // More descriptive error message
    toast.error(
      error.message === 'Request timeout' 
        ? 'Network timeout - please try again' 
        : 'Could not send notification email'
    );
  }
};

