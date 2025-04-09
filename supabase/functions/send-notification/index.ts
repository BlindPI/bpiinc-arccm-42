
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@1.0.0";
import { 
  getEmailTemplate, 
  getWelcomeEmailTemplate, 
  getInvitationEmailTemplate,
  getCertificateRequestEmailTemplate, 
  getCertificateApprovedEmailTemplate, 
  getCertificateRejectedEmailTemplate 
} from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { 
      userId,
      recipientEmail,
      recipientName,
      title,
      message,
      type = 'INFO',
      actionUrl,
      sendEmail = true,
      priority = 'NORMAL',
      category = 'CERTIFICATE',
      courseName,
      rejectionReason,
      role
    } = await req.json();

    // Create notification in database
    let notificationId = null;
    if (userId) {
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title || getDefaultTitle(type, courseName),
          message,
          type,
          action_url: actionUrl,
          category,
          priority,
          read: false
        })
        .select()
        .single();

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        notificationId = notificationData.id;
        console.log("Notification created:", notificationId);
      }
    }

    // Send email notification if requested
    let emailSent = false;
    if (sendEmail && recipientEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Configure appropriate email template based on notification type
        const emailTitle = title || getDefaultTitle(type, courseName);
        let emailHtml = '';
        
        // Select the appropriate template based on notification type
        if (type === 'WELCOME') {
          emailHtml = getWelcomeEmailTemplate(recipientName || 'User', actionUrl);
        } else if (type === 'INVITATION') {
          emailHtml = getInvitationEmailTemplate(recipientName || '', role || 'User', actionUrl || '');
        } else if (type === 'CERTIFICATE_REQUEST') {
          emailHtml = getCertificateRequestEmailTemplate(recipientName || 'User', courseName || '', message);
        } else if (type === 'CERTIFICATE_APPROVED') {
          emailHtml = getCertificateApprovedEmailTemplate(recipientName || 'User', courseName || '', message, actionUrl);
        } else if (type === 'CERTIFICATE_REJECTED') {
          emailHtml = getCertificateRejectedEmailTemplate(recipientName || 'User', courseName || '', message, rejectionReason);
        } else {
          // For any other notification type, use the generic template
          emailHtml = getEmailTemplate({
            title: emailTitle,
            content: `<p>${message}</p>`,
            actionUrl,
            actionText: actionUrl ? 'View Details' : undefined
          });
        }
        
        const { data, error } = await resend.emails.send({
          from: 'Assured Response <notifications@certtrainingtracker.com>',
          to: recipientEmail,
          subject: emailTitle,
          html: emailHtml,
        });

        if (error) {
          console.error("Error sending email:", error);
        } else {
          emailSent = true;
          console.log("Email sent:", data);
        }
      } catch (emailError) {
        console.error("Error with email service:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id: notificationId,
        email_sent: emailSent 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

// Helper function for email templates
function getDefaultTitle(type: string, courseName?: string): string {
  switch (type) {
    case 'WELCOME':
      return 'Welcome to Assured Response Training Center';
    case 'INVITATION':
      return 'Invitation to Assured Response Training Center';
    case 'CERTIFICATE_REQUEST':
      return `Certificate Request ${courseName ? `for ${courseName}` : ''} Submitted`;
    case 'CERTIFICATE_APPROVED':
      return `Certificate ${courseName ? `for ${courseName}` : ''} Approved`;
    case 'CERTIFICATE_REJECTED':
      return `Certificate ${courseName ? `for ${courseName}` : ''} Request Declined`;
    case 'ERROR':
      return 'Error Notification';
    case 'WARNING':
      return 'Warning Notification';
    case 'SUCCESS':
      return 'Success Notification';
    default:
      return 'Assured Response Notification';
  }
}
