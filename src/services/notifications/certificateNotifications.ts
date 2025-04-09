
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
          rejectionReason: params.rejectionReason,
          priority: getPriorityForNotificationType(params.type),
          category: 'CERTIFICATE'
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

// Helper function to determine priority based on notification type
function getPriorityForNotificationType(type?: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  switch (type) {
    case 'CERTIFICATE_APPROVED':
      return 'HIGH';
    case 'CERTIFICATE_REJECTED':
      return 'HIGH';
    case 'CERTIFICATE_REQUEST':
      return 'NORMAL';
    case 'ERROR':
      return 'URGENT';
    case 'WARNING':
      return 'HIGH';
    default:
      return 'NORMAL';
  }
}

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
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        category: params.category || 'GENERAL',
        priority: params.priority || 'NORMAL',
        action_url: params.actionUrl,
        image_url: params.imageUrl,
        metadata: params.metadata || {},
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
