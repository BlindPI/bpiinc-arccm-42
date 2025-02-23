
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: params
    });

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    toast.error('Could not send notification email');
  }
};
