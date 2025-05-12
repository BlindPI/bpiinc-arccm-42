
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationParams } from '@/types/certificates';

export const sendCertificateNotification = async (params: NotificationParams) => {
  try {
    console.log('Sending certificate notification:', {
      type: params.type,
      recipient: params.recipientName,
      email: params.recipientEmail,
      courseName: params.courseName
    });
    
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
        setTimeout(() => reject(new Error('Request timeout')), 15000) // Increased timeout to 15 seconds
      )
    ]);

    if (result.error) {
      console.error('Error sending notification:', result.error);
      throw result.error;
    }
    
    console.log('Notification sent successfully');
    
    // If it's an approval or rejection, also notify all admins
    if (params.type === 'CERTIFICATE_APPROVED' || params.type === 'CERTIFICATE_REJECTED') {
      try {
        await notifyAdministrators({
          title: `Certificate ${params.type === 'CERTIFICATE_APPROVED' ? 'Approved' : 'Rejected'}`,
          message: `Certificate for ${params.recipientName} (${params.courseName}) has been ${params.type === 'CERTIFICATE_APPROVED' ? 'approved' : 'rejected'}.`,
          priority: 'NORMAL',
          type: params.type
        });
      } catch (adminNotifyError) {
        console.error('Failed to notify administrators:', adminNotifyError);
        // Don't fail the main notification if admin notification fails
      }
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

// Helper function to get all admin users
async function getAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('role', ['SA', 'AD']);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

// Function to notify all administrators
export async function notifyAdministrators(params: {
  title: string;
  message: string;
  type?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  actionUrl?: string;
}) {
  try {
    const adminUsers = await getAdminUsers();
    console.log(`Sending notifications to ${adminUsers.length} administrators`);
    
    // Create notifications in parallel using Promise.all
    await Promise.all(
      adminUsers.map(admin => 
        createNotification({
          userId: admin.id,
          title: params.title,
          message: params.message,
          type: params.type as any || 'INFO',
          category: params.category || 'CERTIFICATE',
          priority: params.priority || 'NORMAL',
          actionUrl: params.actionUrl
        }).catch(error => {
          console.error(`Failed to notify admin ${admin.email}:`, error);
          // Don't fail the entire operation if one admin notification fails
          return null;
        })
      )
    );
    
    return { success: true, count: adminUsers.length };
  } catch (error) {
    console.error('Failed to notify administrators:', error);
    throw error;
  }
}

// Function to manually process the notification queue
export const processNotificationQueue = async () => {
  try {
    console.log('Processing notification queue');
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

// Function to create a notification without sending an email - removed metadata and imageUrl fields
export const createNotification = async (params: {
  userId: string;
  title: string;
  message: string;
  type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
}) => {
  try {
    console.log(`Creating notification for user ${params.userId}: ${params.title}`);
    
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
