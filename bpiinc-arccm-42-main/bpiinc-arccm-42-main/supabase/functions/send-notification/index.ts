import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0"; // Using the latest version

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

    // Check if this is a configuration check request
    const params = await req.json();

    if (params.checkConfigOnly) {
      console.log("Checking email configuration");
      let domainVerified = false;
      let configError = null;

      if (!resendApiKey) {
        configError = "RESEND_API_KEY is not set in environment variables";
      } else {
        try {
          const resend = new Resend(resendApiKey);
          // Check domains to see if any are verified
          const domainsResult = await resend.domains.list();
          console.log("Domains result:", domainsResult);
          
          if (!domainsResult.error && domainsResult.data) {
            // Check if any domains are verified
            const verifiedDomains = domainsResult.data.filter(domain => 
              domain.status === 'verified' || domain.status === 'active'
            );
            
            domainVerified = verifiedDomains.length > 0;
            
            if (!domainVerified) {
              configError = "No verified domains found. Please verify a domain in Resend or use the default domain.";
            }
          } else if (domainsResult.error) {
            configError = `Error checking domains: ${domainsResult.error.message}`;
          }
        } catch (error) {
          console.error("Error checking Resend configuration:", error);
          configError = `Error checking Resend configuration: ${error instanceof Error ? error.message : String(error)}`;
        }
      }

      return new Response(
        JSON.stringify({ 
          hasResendApiKey: !!resendApiKey, 
          domainVerified,
          error: configError
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Regular notification processing
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables");
      throw new Error("Email service configuration missing: RESEND_API_KEY");
    }

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
      category = 'GENERAL',
      metadata = {},
      pagePath,
      notificationTypeId
    } = params;

    // Log notification request details
    console.log("Notification request:", {
      type,
      userId,
      recipientEmail: recipientEmail ? `${recipientEmail.substring(0, 5)}...` : undefined,
      hasActionUrl: !!actionUrl,
      sendEmail,
      title,
      category,
      priority,
      notificationTypeId,
      pagePath
    });

    // If notification type ID is provided, get the notification type details
    let notificationType = null;
    if (notificationTypeId) {
      const { data, error } = await supabase
        .from('notification_types')
        .select('*')
        .eq('id', notificationTypeId)
        .single();
      
      if (error) {
        console.error("Error fetching notification type:", error);
      } else {
        notificationType = data;
      }
    }

    // Check user notification preferences if userId is provided
    let shouldSendEmail = sendEmail;
    let shouldSendBrowser = false;
    
    if (userId && notificationTypeId) {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .eq('notification_type_id', notificationTypeId)
          .single();
        
        if (!error && data) {
          shouldSendEmail = data.email_enabled;
          shouldSendBrowser = data.browser_enabled;
        } else {
          // If no specific preference, use defaults based on notification type
          if (notificationType) {
            shouldSendEmail = notificationType.requires_email;
          }
        }
      } catch (prefError) {
        console.error("Error checking notification preferences:", prefError);
      }
    }

    // Create notification in database
    let notificationId = null;
    if (userId) {
      try {
        // Prepare metadata with page path if provided
        const finalMetadata = {
          ...metadata
        };
        
        if (pagePath) {
          finalMetadata.page_path = pagePath;
        }
        
        const { data: notificationData, error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: title || getDefaultTitle(type, category),
            message,
            type,
            action_url: actionUrl,
            category,
            priority,
            read: false,
            is_dismissed: false,
            metadata: finalMetadata
          })
          .select()
          .single();

        if (notificationError) {
          console.error("Error creating notification:", notificationError);
        } else {
          notificationId = notificationData.id;
          console.log("Notification created:", notificationId);
          
          // If we want to queue the email for later processing
          if (shouldSendEmail && recipientEmail) {
            try {
              const { error: queueError } = await supabase
                .from('notification_queue')
                .insert({
                  notification_id: notificationId,
                  status: 'PENDING',
                  priority: priority,
                  category: category
                });
                
              if (queueError) {
                console.error("Error queueing notification:", queueError);
              } else {
                console.log("Email notification queued successfully");
              }
            } catch (queueError) {
              console.error("Failed to queue notification:", queueError);
            }
          }
        }
      } catch (insertError) {
        console.error("Failed to insert notification:", insertError);
      }
    }

    // Queue email notification if requested
    let emailSent = false;
    let emailError = null;
    
    // Only try to send an email directly (not via queue) if specifically requested with the test flag
    // This is used by the diagnostic tool
    if (shouldSendEmail && recipientEmail && resendApiKey && category === 'TEST') {
      try {
        console.log("Initializing Resend with API key length:", resendApiKey.length);
        const resend = new Resend(resendApiKey);
        
        // Configure appropriate email template based on notification type
        const emailTitle = title || getDefaultTitle(type, category);
        let emailHtml = '';
        
        // Select the appropriate template based on notification type
        if (type === 'WELCOME') {
          emailHtml = getWelcomeEmailTemplate(recipientName || 'User', actionUrl);
        } else if (type === 'INVITATION') {
          emailHtml = getInvitationEmailTemplate(recipientName || '', metadata?.role || 'User', actionUrl || '');
        } else if (type === 'CERTIFICATE_REQUEST') {
          emailHtml = getCertificateRequestEmailTemplate(recipientName || 'User', metadata?.courseName || '', message);
        } else if (type === 'CERTIFICATE_APPROVED') {
          emailHtml = getCertificateApprovedEmailTemplate(recipientName || 'User', metadata?.courseName || '', message, actionUrl);
        } else if (type === 'CERTIFICATE_REJECTED') {
          emailHtml = getCertificateRejectedEmailTemplate(recipientName || 'User', metadata?.courseName || '', message, metadata?.rejectionReason);
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
        
        // Send the email using Resend - with full error handling and timeouts
        try {
          // Use Promise.race to implement a timeout
          const emailResult = await Promise.race([
            resend.emails.send({
              from: 'Assured Response <notifications@mail.bpiincworks.com>',
              to: recipientEmail,
              subject: emailTitle,
              html: emailHtml,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000)
            )
          ]);

          console.log("Raw Resend response:", JSON.stringify(emailResult));

          if (emailResult.error) {
            emailError = emailResult.error;
            console.error("Error from Resend API:", emailError);
          } else {
            emailSent = true;
            console.log("Email sent successfully:", emailResult.data?.id);
          }
        } catch (sendError) {
          emailError = sendError;
          console.error("Failed to send email via Resend:", sendError);
          
          // Log detailed error information
          if (sendError instanceof Error) {
            console.error("Error name:", sendError.name);
            console.error("Error message:", sendError.message);
            console.error("Error stack:", sendError.stack);
          } else {
            console.error("Unknown error type:", typeof sendError);
          }
        }
      } catch (emailError) {
        console.error("Error with email service setup:", emailError);
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
        email_error: emailError ? (emailError instanceof Error ? emailError.message : String(emailError)) : null,
        queued: shouldSendEmail && recipientEmail && category !== 'TEST',
        browser_notification: shouldSendBrowser
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
      <p>Your certificate is now available. You can download it from your dashboard.</p>
    `,
    actionUrl: downloadUrl,
    actionText: downloadUrl ? 'View Certificate' : undefined
  });
}

function getCertificateRejectedEmailTemplate(name: string, courseName: string, message: string, rejectionReason?: string) {
  return getEmailTemplate({
    title: 'Certificate Request Rejected',
    preheader: 'Your certificate request has been rejected',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
        ${rejectionReason ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      </div>
      <p>If you have any questions, please contact your administrator.</p>
    `
  });
}

// Helper function to get default title based on notification type
function getDefaultTitle(type: string, category?: string): string {
  switch (type) {
    case 'WELCOME':
      return 'Welcome to Assured Response';
    case 'INVITATION':
      return 'You\'ve Been Invited';
    case 'CERTIFICATE_REQUEST':
      return 'Certificate Request Submitted';
    case 'CERTIFICATE_APPROVED':
      return 'Certificate Approved';
    case 'CERTIFICATE_REJECTED':
      return 'Certificate Request Rejected';
    case 'SUCCESS':
      return 'Success';
    case 'ERROR':
      return 'Error';
    case 'WARNING':
      return 'Warning';
    case 'INFO':
      return 'Information';
    case 'ACTION':
      return 'Action Required';
    default:
      return category ? `${category} Notification` : 'Notification';
  }
}
