
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { Resend } from "https://esm.sh/resend@2.0.0"; // Using the latest version

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

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables");
      throw new Error("Email service configuration missing: RESEND_API_KEY");
    }

    // Initialize email service
    console.log("Initializing Resend with API key length:", resendApiKey.length);
    const resend = new Resend(resendApiKey);

    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending notifications from the queue or use parameters from the request
    let params;
    let processQueue = true;
    
    if (req.method === 'POST') {
      params = await req.json();
      processQueue = params.processQueue !== false;
    }

    const results = [];

    // Process notifications from the queue if requested
    if (processQueue) {
      // Get pending notifications from the queue, order by priority
      const { data: pendingNotifications, error: queueError } = await supabase
        .from('notification_queue')
        .select('id, notification_id, status, created_at, priority, category')
        .eq('status', 'PENDING')
        .order('priority', { ascending: false }) // Process high priority first
        .order('created_at', { ascending: true })
        .limit(50);

      if (queueError) {
        throw new Error(`Failed to fetch pending notifications: ${queueError.message}`);
      }

      console.log(`Processing ${pendingNotifications?.length || 0} pending notifications from queue`);

      // Process each notification from the queue
      const queueResults = await Promise.all((pendingNotifications || []).map(async (item) => {
        try {
          // Get the notification details
          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', item.notification_id)
            .single();

          if (notifError) {
            throw new Error(`Failed to fetch notification: ${notifError.message}`);
          }

          console.log(`Processing notification: ${notification.id}`, {
            title: notification.title,
            type: notification.type,
            category: notification.category
          });

          // Get user email if available
          let userEmail = null;
          let userName = null;
          
          if (notification.user_id) {
            // Get user data from auth
            const { data: userData, error: userError } = await supabase
              .auth.admin.getUserById(notification.user_id);

            if (userError) {
              console.error(`Error fetching user: ${userError.message}`);
            } else {
              userEmail = userData?.user?.email;
              
              // Get profile data for the user's name
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', notification.user_id)
                .single();
                
              if (!profileError && profileData) {
                userName = profileData.display_name;
              }
            }
          }

          if (!userEmail) {
            throw new Error('No recipient email found for notification');
          }

          // Check user preferences for this notification category
          const { data: preferences, error: prefError } = await supabase
            .from('notification_preferences')
            .select('email_enabled')
            .eq('user_id', notification.user_id)
            .eq('category', notification.category)
            .single();
            
          // Skip sending email if user has disabled it
          if (!prefError && preferences && !preferences.email_enabled) {
            console.log(`Email notifications disabled for user ${notification.user_id} in category ${notification.category}`);
            
            // Mark as skipped but not failed
            await supabase
              .from('notification_queue')
              .update({ 
                status: 'SKIPPED',
                processed_at: new Date().toISOString(),
                error: 'Email notifications disabled by user preference'
              })
              .eq('id', item.id);
              
            return { id: item.id, notification_id: notification.id, success: true, skipped: true };
          }

          // Build email content based on notification fields
          const subject = notification.title;
          const message = notification.message;
          const actionUrl = notification.action_url;
          const priority = notification.priority || 'NORMAL';
          const category = notification.category || 'GENERAL';
          const emailTemplate = getEmailTemplate({
            title: subject,
            content: `<p>${message}</p>`,
            actionUrl,
            actionText: actionUrl ? 'View Details' : undefined
          });
          
          // Log email details 
          console.log(`Sending email to ${userEmail} (${userName || 'Unknown User'}): ${subject}`);
          console.log(`Priority: ${priority}, Category: ${category}`);
          
          try {
            // Use Promise.race to implement a timeout
            const emailResult = await Promise.race([
              resend.emails.send({
                from: 'Assured Response <notifications@mail.bpiincworks.com>',
                to: userEmail,
                subject: subject,
                html: emailTemplate,
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000)
              )
            ]);

            console.log("Raw Resend response:", JSON.stringify(emailResult));

            if (emailResult.error) {
              console.error("Error from Resend API:", emailResult.error);
              
              // Mark notification as failed
              await supabase
                .from('notification_queue')
                .update({ 
                  status: 'FAILED',
                  processed_at: new Date().toISOString(),
                  error: emailResult.error.message
                })
                .eq('id', item.id);
                
              return { id: item.id, notification_id: notification.id, success: false, error: emailResult.error.message };
            }

            console.log("Email sent successfully:", emailResult.data?.id);

            // Mark notification as sent
            const { error: updateError } = await supabase
              .from('notification_queue')
              .update({ 
                status: 'SENT',
                processed_at: new Date().toISOString(),
                error: null
              })
              .eq('id', item.id);

            if (updateError) {
              throw new Error(`Failed to update notification status: ${updateError.message}`);
            }

            return { id: item.id, notification_id: notification.id, success: true, email_id: emailResult.data?.id };
          } catch (sendError) {
            console.error(`Error sending email for notification ${item.id}:`, sendError);
            
            // Mark notification as failed
            await supabase
              .from('notification_queue')
              .update({ 
                status: 'FAILED',
                processed_at: new Date().toISOString(),
                error: sendError instanceof Error ? sendError.message : String(sendError)
              })
              .eq('id', item.id);
              
            return { 
              id: item.id, 
              notification_id: notification.id, 
              success: false, 
              error: sendError instanceof Error ? sendError.message : String(sendError) 
            };
          }
        } catch (error) {
          console.error(`Error processing notification ${item.id}:`, error);
          
          // Mark notification as failed
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'FAILED',
              processed_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : String(error)
            })
            .eq('id', item.id);
            
          return { 
            id: item.id, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      }));

      results.push(...queueResults);
    }

    // Process a single notification if provided in the request
    if (params?.notification) {
      try {
        const notification = params.notification;
        
        // Add the notification to the database - removed metadata and image_url fields
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'INFO',
            priority: notification.priority || 'NORMAL',
            category: notification.category || 'GENERAL',
            action_url: notification.action_url
          })
          .select()
          .single();

        if (notifError) {
          throw notifError;
        }

        // Add to queue for email delivery if requested - removed metadata and image_url fields
        if (notification.send_email) {
          const { data: queueData, error: queueError } = await supabase
            .from('notification_queue')
            .insert({
              notification_id: notifData.id,
              status: 'PENDING',
              priority: notification.priority || 'NORMAL',
              category: notification.category || 'GENERAL'
            })
            .select()
            .single();

          if (queueError) {
            console.error("Error queueing notification for email:", queueError);
          }
        }

        results.push({ 
          id: notifData.id, 
          success: true, 
          queued: notification.send_email 
        });
      } catch (error) {
        console.error("Error creating notification:", error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error("Error in batch notification processing:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
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

// Helper function for email templates
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
