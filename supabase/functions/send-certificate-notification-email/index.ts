import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Parse request body
    const {
      notification_id,
      user_email,
      user_name,
      title,
      message,
      notification_type
    } = await req.json();

    console.log(`Sending certificate notification email to ${user_email}`);

    // Generate email content based on notification type
    const emailContent = generateEmailContent(notification_type, user_name, title, message);
    
    // Send email using Resend
    const resend = new Resend(resendApiKey);
    const emailResult = await resend.emails.send({
      from: 'Assured Response <notifications@mail.bpiincworks.com>',
      to: user_email,
      subject: title,
      html: emailContent,
    });

    if (emailResult.error) {
      console.error(`Error sending email to ${user_email}:`, emailResult.error);
      throw new Error(`Email sending failed: ${emailResult.error.message}`);
    }

    console.log(`Certificate notification email sent successfully to ${user_email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        email_id: emailResult.data?.id,
        message: 'Email sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Error sending certificate notification email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
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

// Generate email content based on notification type
function generateEmailContent(notificationType: string, userName: string, title: string, message: string): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  `;

  let actionButton = '';
  let additionalInfo = '';

  switch (notificationType) {
    case 'batch_submitted':
      actionButton = `<a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.bpiincworks.com'}/certificates" class="button">View Certificate Requests</a>`;
      additionalInfo = '<p>Your certificate batch has been submitted for review. You will receive another notification once the review is complete.</p>';
      break;
    case 'batch_approved':
      actionButton = `<a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.bpiincworks.com'}/certificates" class="button">View Approved Certificates</a>`;
      additionalInfo = '<p>Congratulations! Your certificate batch has been approved and certificates are now available for download.</p>';
      break;
    case 'batch_rejected':
      actionButton = `<a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.bpiincworks.com'}/certificates" class="button">Review Feedback</a>`;
      additionalInfo = '<p>Your certificate batch requires attention. Please review the feedback and resubmit if necessary.</p>';
      break;
    case 'certificate_approved':
      actionButton = `<a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.bpiincworks.com'}/certificates" class="button">Download Certificate</a>`;
      additionalInfo = '<p>Your certificate has been approved and is ready for download.</p>';
      break;
    case 'certificate_rejected':
      actionButton = `<a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.bpiincworks.com'}/certificates" class="button">View Details</a>`;
      additionalInfo = '<p>Your certificate request needs revision. Please check the details and resubmit.</p>';
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Assured Response Training Center</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Hello ${userName},</p>
          <p>${message}</p>
          ${additionalInfo}
          ${actionButton}
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2025 Assured Response Training Center. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}