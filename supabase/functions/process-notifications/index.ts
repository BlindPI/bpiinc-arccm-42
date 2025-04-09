
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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
      // Get pending notifications from the queue
      const { data: pendingNotifications, error: queueError } = await supabase
        .from('notification_queue')
        .select('id, notification_id, status, created_at')
        .eq('status', 'PENDING')
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

          // Get user email if available
          let userEmail = null;
          if (notification.user_id) {
            const { data: userData, error: userError } = await supabase
              .auth.admin.getUserById(notification.user_id);

            if (userError) {
              console.error(`Error fetching user: ${userError.message}`);
            } else {
              userEmail = userData?.user?.email;
            }
          }

          if (!userEmail) {
            throw new Error('No recipient email found for notification');
          }

          // Send email notification (mock implementation)
          console.log(`Would send email to ${userEmail}: ${notification.title}`);
          
          // In a real implementation, here you would connect to your email service provider
          // For example, using SendGrid, Mailgun, Resend, etc.
          
          // For now simulate a successful email send
          const emailSuccess = true;

          // Mark notification as sent
          const { error: updateError } = await supabase
            .from('notification_queue')
            .update({ 
              status: emailSuccess ? 'SENT' : 'FAILED',
              processed_at: new Date().toISOString(),
              error: emailSuccess ? null : 'Failed to send email'
            })
            .eq('id', item.id);

          if (updateError) {
            throw new Error(`Failed to update notification status: ${updateError.message}`);
          }

          return { id: item.id, notification_id: notification.id, success: true };
        } catch (error) {
          console.error(`Error processing notification ${item.id}:`, error);
          
          // Mark notification as failed
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'FAILED',
              processed_at: new Date().toISOString(),
              error: error.message
            })
            .eq('id', item.id);
            
          return { id: item.id, success: false, error: error.message };
        }
      }));

      results.push(...queueResults);
    }

    // Process a single notification if provided in the request
    if (params?.notification) {
      try {
        const notification = params.notification;
        
        // Add the notification to the database
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'INFO',
            action_url: notification.action_url,
          })
          .select()
          .single();

        if (notifError) {
          throw notifError;
        }

        // Add to queue for email delivery if requested
        if (notification.send_email) {
          const { data: queueData, error: queueError } = await supabase
            .from('notification_queue')
            .insert({
              notification_id: notifData.id,
              status: 'PENDING',
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
          error: error.message 
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
