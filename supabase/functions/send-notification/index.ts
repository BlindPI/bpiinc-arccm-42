
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@1.0.0";

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
      rejectionReason
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
        let emailHtml = `<p>${message}</p>`;
        
        if (type === 'CERTIFICATE_REQUEST') {
          emailHtml = getCertificateRequestEmailTemplate(recipientName, courseName, message);
        } else if (type === 'CERTIFICATE_APPROVED') {
          emailHtml = getCertificateApprovedEmailTemplate(recipientName, courseName, message, actionUrl);
        } else if (type === 'CERTIFICATE_REJECTED') {
          emailHtml = getCertificateRejectedEmailTemplate(recipientName, courseName, message, rejectionReason);
        }
        
        const { data, error } = await resend.emails.send({
          from: 'notifications@certtrainingtracker.com',
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

// Helper functions for email templates
function getDefaultTitle(type: string, courseName?: string): string {
  switch (type) {
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
      return 'Training Tracker Notification';
  }
}

function getCertificateRequestEmailTemplate(name: string, courseName: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">Certificate Request Submitted</h2>
      </div>
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      <p>Your certificate request has been submitted and is pending approval. You will receive another notification once your request has been processed.</p>
      <p>Thank you,<br>Training Tracker Team</p>
    </div>
  `;
}

function getCertificateApprovedEmailTemplate(name: string, courseName: string, message: string, downloadUrl?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4CAF50;">Certificate Approved</h2>
      </div>
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      ${downloadUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${downloadUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Certificate</a>
      </div>
      ` : ''}
      <p>You can also download your certificate from your Training Tracker account dashboard.</p>
      <p>Thank you,<br>Training Tracker Team</p>
    </div>
  `;
}

function getCertificateRejectedEmailTemplate(name: string, courseName: string, message: string, rejectionReason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #F44336;">Certificate Request Declined</h2>
      </div>
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
        ${rejectionReason ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      </div>
      <p>If you believe this decision was made in error or need further information, please contact your training administrator.</p>
      <p>Thank you,<br>Training Tracker Team</p>
    </div>
  `;
}
