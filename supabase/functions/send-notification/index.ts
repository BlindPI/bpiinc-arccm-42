
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationParams {
  userId?: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION' | 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  actionUrl?: string;
  email?: string;
  emailSubject?: string;
  emailContent?: string;
  recipientEmail?: string;
  recipientName?: string;
  courseName?: string;
  sendEmail?: boolean;
  templateId?: string;
  templateData?: Record<string, any>;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

// Template functions for different notification types
const generateEmailTemplate = (params: NotificationParams): string => {
  switch (params.type) {
    case 'CERTIFICATE_REQUEST':
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a73e8;">Certificate Request Confirmation</h1>
            <p>Hello ${params.recipientName || 'there'},</p>
            <p>We have received your certificate request for <strong>${params.courseName || 'your course'}</strong>.</p>
            <p>Our team will review your request shortly. You will be notified once the review is complete.</p>
            <p>Thank you for your patience.</p>
            <p>Best regards,<br>Certification Team</p>
          </body>
        </html>
      `;
    
    case 'CERTIFICATE_APPROVED':
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #34a853;">Certificate Approved</h1>
            <p>Hello ${params.recipientName || 'there'},</p>
            <p>Great news! Your certificate for <strong>${params.courseName || 'your course'}</strong> has been approved.</p>
            <p>You can access your certificate by clicking the button below:</p>
            ${params.actionUrl ? `
              <p style="text-align: center; margin: 30px 0;">
                <a href="${params.actionUrl}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  View Certificate
                </a>
              </p>
            ` : ''}
            <p>Congratulations on your achievement!</p>
            <p>Best regards,<br>Certification Team</p>
          </body>
        </html>
      `;
    
    case 'CERTIFICATE_REJECTED':
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ea4335;">Certificate Request Not Approved</h1>
            <p>Hello ${params.recipientName || 'there'},</p>
            <p>We regret to inform you that your certificate request for <strong>${params.courseName || 'your course'}</strong> could not be approved at this time.</p>
            <p><strong>Reason:</strong> ${params.message || 'Please contact the certification team for more information.'}</p>
            <p>You can submit a new request after addressing the feedback provided.</p>
            <p>If you have any questions, please contact the certification team.</p>
            <p>Best regards,<br>Certification Team</p>
          </body>
        </html>
      `;
    
    default:
      // Generic email template for other notifications
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a73e8;">${params.title || 'Notification'}</h1>
            <p>Hello,</p>
            <p>${params.message || 'You have a new notification.'}</p>
            ${params.actionUrl ? `
              <p style="text-align: center; margin: 30px 0;">
                <a href="${params.actionUrl}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  View Details
                </a>
              </p>
            ` : ''}
            <p>Best regards,<br>Your Application Team</p>
          </body>
        </html>
      `;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request body
    const params = await req.json() as NotificationParams;
    console.log("Notification params:", params);

    if (!params.title || !params.message || !params.type) {
      throw new Error("Missing required notification parameters");
    }

    // Default priority and category if not provided
    const priority = params.priority || 'NORMAL';
    const category = params.category || 'GENERAL';
    
    // Create the notification in the database if there's a userId
    let notification = null;
    
    if (params.userId) {
      const { data, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          priority: priority,
          category: category,
          action_url: params.actionUrl,
          image_url: params.imageUrl,
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        throw notificationError;
      }
      
      notification = data;
      
      // Add notification to queue if email delivery is requested
      if (params.sendEmail) {
        const { error: queueError } = await supabase
          .from('notification_queue')
          .insert({
            notification_id: notification.id,
            status: 'PENDING',
            priority: priority,
            category: category,
            image_url: params.imageUrl,
            metadata: params.metadata || {}
          });
          
        if (queueError) {
          console.error("Error adding notification to queue:", queueError);
        }
      }
    }

    // Handle direct email sending (for cases without userId)
    let emailResponse = null;
    
    if ((params.recipientEmail || params.email) && 
        (params.type === 'CERTIFICATE_REQUEST' || 
         params.type === 'CERTIFICATE_APPROVED' || 
         params.type === 'CERTIFICATE_REJECTED' || 
         (params.emailSubject && params.emailContent))) {
      
      // Generate appropriate email template based on notification type
      const emailContent = params.emailContent || generateEmailTemplate(params);
      const emailSubject = params.emailSubject || 
                          (params.type === 'CERTIFICATE_REQUEST' ? 'Certificate Request Confirmation' :
                           params.type === 'CERTIFICATE_APPROVED' ? 'Your Certificate has been Approved' :
                           params.type === 'CERTIFICATE_REJECTED' ? 'Certificate Request Not Approved' :
                           params.title);
      
      // In a real implementation, here you would send the email
      // For example, using SendGrid, Mailgun, Resend, etc.
      
      console.log(`Would send email to ${params.recipientEmail || params.email} with subject "${emailSubject}"`);
      console.log("Email content:", emailContent);
      
      emailResponse = {
        type: params.type.toLowerCase(),
        recipient: params.recipientEmail || params.email,
        subject: emailSubject,
        success: true
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: notification ? 
          params.sendEmail ? 
            "Notification created and queued for email delivery" : 
            "Notification created successfully" 
          : "Email notification prepared", 
        data: notification,
        email: emailResponse
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
