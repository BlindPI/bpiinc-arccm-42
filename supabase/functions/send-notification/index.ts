
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0"; // Update to the latest version

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

    // Log environment configuration for debugging
    console.log("Environment configuration:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey, 
      hasResendApiKey: !!resendApiKey 
    });

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

    // Log notification request details
    console.log("Notification request:", {
      type,
      userId,
      recipientEmail: recipientEmail ? `${recipientEmail.substring(0, 8)}...` : undefined,
      hasActionUrl: !!actionUrl,
      sendEmail
    });

    // Create notification in database
    let notificationId = null;
    if (userId) {
      try {
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
      } catch (insertError) {
        console.error("Failed to insert notification:", insertError);
      }
    }

    // Queue email notification if requested
    let emailSent = false;
    let emailError = null;
    
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
        
        // Log that we're about to send the email
        console.log(`Attempting to send email to ${recipientEmail} with subject: ${emailTitle}`);
        
        // Send the email using Resend
        const emailResult = await resend.emails.send({
          from: 'Assured Response <notifications@mail.bpiincworks.com>',
          to: recipientEmail,
          subject: emailTitle,
          html: emailHtml,
        });

        if (emailResult.error) {
          emailError = emailResult.error;
          console.error("Error from Resend API:", emailError);
        } else {
          emailSent = true;
          console.log("Email sent successfully:", emailResult.data?.id);
          
          // If using the queue system, add an entry to the queue
          if (notificationId) {
            try {
              const { error: queueError } = await supabase
                .from('notification_queue')
                .insert({
                  notification_id: notificationId,
                  status: 'SENT',
                  processed_at: new Date().toISOString(),
                });

              if (queueError) {
                console.error("Error adding to notification queue:", queueError);
              }
            } catch (queueInsertError) {
              console.error("Failed to update notification queue:", queueInsertError);
            }
          }
        }
      } catch (emailError) {
        console.error("Error with email service:", emailError);
        // Log more detailed error information
        if (emailError instanceof Error) {
          console.error("Error name:", emailError.name);
          console.error("Error message:", emailError.message);
          console.error("Error stack:", emailError.stack);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id: notificationId,
        email_sent: emailSent,
        email_error: emailError ? emailError.message : null
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

// Helper function for email templates - import from shared code
function getEmailTemplate(options: {
  title: string;
  preheader?: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
}) {
  const {
    title,
    preheader = '',
    content,
    actionUrl,
    actionText,
    footerText = '© 2025 Assured Response Training Center. All rights reserved.'
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style>
        @media only screen and (max-width: 600px) {
          .inner-body {
            width: 100% !important;
          }
          .footer {
            width: 100% !important;
          }
        }
        
        @media only screen and (max-width: 500px) {
          .button {
            width: 100% !important;
          }
        }
        
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }
        
        body {
          background-color: #f8fafc;
          color: #4a5568;
          height: 100%;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          width: 100%;
        }
        
        .container {
          background-color: #f8fafc;
          margin: 0 auto;
          padding: 40px 0;
          max-width: 600px;
          width: 100%;
        }
        
        .content {
          margin: 0;
          padding: 0;
          width: 100%;
        }
        
        .header {
          padding: 25px 0;
          text-align: center;
        }
        
        .header img {
          max-height: 60px;
        }
        
        .inner-body {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin: 0 auto;
          padding: 40px;
          width: 570px;
        }
        
        h1 {
          color: #2d3748;
          font-size: 24px;
          font-weight: bold;
          margin-top: 0;
          margin-bottom: 16px;
          text-align: left;
        }
        
        p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.5em;
          margin-top: 0;
          margin-bottom: 16px;
          text-align: left;
        }
        
        .button {
          border-radius: 6px;
          color: #ffffff;
          display: inline-block;
          font-size: 16px;
          font-weight: bold;
          padding: 12px 24px;
          text-align: center;
          text-decoration: none;
          background-color: #4F46E5;
          margin: 16px 0;
        }
        
        .footer {
          color: #718096;
          font-size: 14px;
          margin: 0 auto;
          padding: 32px 0;
          text-align: center;
          width: 570px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <img src="https://picsum.photos/id/0/5616/3744" alt="Assured Response Logo" height="50">
          </div>
          
          <div class="inner-body">
            <h1>${title}</h1>
            ${content}
            
            ${actionUrl && actionText ? `
            <div style="text-align: center;">
              <a href="${actionUrl}" class="button" target="_blank">${actionText}</a>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>${footerText}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper email templates - these would ideally be imported from a shared module
function getWelcomeEmailTemplate(name: string, actionUrl?: string) {
  return getEmailTemplate({
    title: 'Welcome to Assured Response Training Center',
    preheader: 'Your account has been created successfully',
    content: `
      <p>Hello ${name},</p>
      <p>Welcome to Assured Response Training Center! Your account has been created successfully.</p>
      <p>Our platform offers a comprehensive certification management system where you can:</p>
      <ul>
        <li>Access your training certificates</li>
        <li>Submit certification requests</li>
        <li>Track your training progress</li>
        <li>Manage your profile and notification preferences</li>
      </ul>
      <p>We're excited to have you on board!</p>
    `,
    actionUrl,
    actionText: actionUrl ? 'Access Your Account' : undefined
  });
}

function getInvitationEmailTemplate(name: string, role: string, actionUrl: string) {
  return getEmailTemplate({
    title: 'You\'ve Been Invited to Assured Response',
    preheader: 'Join Assured Response Training Center',
    content: `
      <p>Hello${name ? ' ' + name : ''},</p>
      <p>You have been invited to join the Assured Response Training Center as a <strong>${role}</strong>.</p>
      <p>Click the button below to accept the invitation and set up your account:</p>
    `,
    actionUrl,
    actionText: 'Accept Invitation'
  });
}

function getCertificateRequestEmailTemplate(name: string, courseName: string, message: string) {
  return getEmailTemplate({
    title: 'Certificate Request Submitted',
    preheader: 'Your certificate request has been received',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      <p>Your certificate request has been submitted and is pending approval. You will receive another notification once your request has been processed.</p>
    `
  });
}

function getCertificateApprovedEmailTemplate(name: string, courseName: string, message: string, downloadUrl?: string) {
  return getEmailTemplate({
    title: 'Certificate Approved',
    preheader: 'Your certificate request has been approved',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      <p>You can download your certificate using the button below or from your account dashboard.</p>
    `,
    actionUrl: downloadUrl,
    actionText: downloadUrl ? 'Download Certificate' : undefined
  });
}

function getCertificateRejectedEmailTemplate(name: string, courseName: string, message: string, rejectionReason?: string) {
  return getEmailTemplate({
    title: 'Certificate Request Declined',
    preheader: 'Your certificate request has been declined',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
        ${rejectionReason ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      </div>
      <p>If you believe this decision was made in error or need further information, please contact your training administrator.</p>
    `
  });
}

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
