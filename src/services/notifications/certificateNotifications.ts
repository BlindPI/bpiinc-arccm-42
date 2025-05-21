
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
    
    // Use edge function to create notification and queue email
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
        setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 seconds timeout
      )
    ]);

    if (result.error) {
      console.error('Error sending notification:', result.error);
      throw result.error;
    }
    
    // Check if we got a response that the notification was queued for email delivery
    if (result.data?.queued) {
      console.log('Email notification queued for delivery');
    }
    
    // Check if email was sent immediately (for test emails)
    if (result.data?.email_error) {
      console.warn('Email notification not sent:', result.data.email_error);
      // Don't throw an error, just log it - the in-app notification was likely created
    } else if (result.data?.email_sent) {
      console.log('Email notification sent successfully');
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
    
    // Create notifications in parallel using the edge function
    const results = await Promise.all(
      adminUsers.map(async admin => {
        try {
          const result = await supabase.functions.invoke('send-notification', {
            body: {
              userId: admin.id,
              recipientEmail: admin.email,
              title: params.title,
              message: params.message,
              type: params.type || 'INFO',
              category: params.category || 'CERTIFICATE',
              priority: params.priority || 'NORMAL',
              actionUrl: params.actionUrl,
              sendEmail: true
            }
          });
          
          if (result.error) {
            console.error(`Failed to notify admin ${admin.email}:`, result.error);
            return { success: false, admin: admin.email, error: result.error };
          }
          
          return { success: true, admin: admin.email };
        } catch (error) {
          console.error(`Failed to notify admin ${admin.email}:`, error);
          return { success: false, admin: admin.email, error };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    if (successCount < adminUsers.length) {
      console.warn(`Only ${successCount} of ${adminUsers.length} admin notifications were sent successfully`);
    }
    
    return { success: true, count: successCount };
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

// Function to create in-app only notification
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
    
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        category: params.category || 'GENERAL',
        priority: params.priority || 'NORMAL',
        actionUrl: params.actionUrl,
        sendEmail: false // Only create in-app notification
      }
    });
      
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

// Create a direct test function for email sending (helpful for troubleshooting)
export const testEmailSending = async (recipientEmail: string) => {
  try {
    console.log(`Testing email sending to ${recipientEmail}`);
    
    const result = await supabase.functions.invoke('send-notification', {
      body: {
        recipientEmail,
        title: 'Test Email',
        message: 'This is a test email to verify the email sending functionality is working.',
        type: 'INFO',
        sendEmail: true,
        priority: 'NORMAL',
        category: 'TEST'
      }
    });
    
    if (result.error) {
      console.error('Error testing email:', result.error);
      toast.error('Failed to send test email');
      throw result.error;
    }
    
    if (result.data?.email_error) {
      console.error('Test email not sent:', result.data.email_error);
      toast.error(`Email test failed: ${result.data.email_error}`);
      return { success: false, error: result.data.email_error };
    }
    
    toast.success('Test email sent successfully');
    return { 
      success: true,
      notificationId: result.data?.notification_id
    };
  } catch (error) {
    console.error('Failed to test email:', error);
    toast.error('Email test failed');
    throw error;
  }
};

// Add function for batch certificate emailing with improved error handling and retries
export const sendBatchCertificateEmails = async (certificateIds: string[], certificates: any[]) => {
  try {
    console.log(`Sending batch emails for ${certificateIds.length} certificates`);
    
    // Create batch operation record
    const { data: batchOp, error: batchError } = await supabase
      .from('email_batch_operations')
      .insert({
        total_certificates: certificateIds.length,
        processed_certificates: 0,
        status: 'PENDING',
        successful_emails: 0,
        failed_emails: 0,
        is_visible: true
      })
      .select()
      .single();
      
    if (batchError) throw batchError;
    
    // Call the Edge Function with retry logic
    const maxRetries = 2;
    let attempt = 0;
    let result;
    let error;
    
    while (attempt <= maxRetries) {
      try {
        result = await supabase.functions.invoke('send-batch-certificate-emails', {
          body: {
            certificateIds,
            certificates,
            batchId: batchOp.id
          }
        });
        
        if (!result.error) {
          break; // Success, exit retry loop
        }
        
        error = result.error;
        console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        attempt++;
        
        if (attempt <= maxRetries) {
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      } catch (invokeError) {
        error = invokeError;
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed with exception:`, invokeError);
        attempt++;
        
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    if (error) {
      // Mark batch as failed if all retries were exhausted
      await supabase
        .from('email_batch_operations')
        .update({
          status: 'FAILED',
          error_message: error.message || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchOp.id);
        
      throw error;
    }
    
    return {
      success: true,
      batchId: batchOp.id,
      message: 'Batch email process started'
    };
  } catch (error) {
    console.error('Failed to start batch email process:', error);
    toast.error(`Failed to send batch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};