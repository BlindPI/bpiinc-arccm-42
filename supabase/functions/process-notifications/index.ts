
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // This function would typically be triggered by a scheduled cron job
    // or by a webhook when a notification is added to the queue
    
    // Get pending notifications from the queue
    const { data: pendingNotifications, error: queueError } = await supabase
      .from('notification_queue')
      .select('id, notification_id, status')
      .eq('status', 'PENDING')
      .limit(50);

    if (queueError) {
      throw new Error(`Failed to fetch pending notifications: ${queueError.message}`);
    }

    console.log(`Processing ${pendingNotifications?.length || 0} pending notifications`);

    // Process each notification
    const results = await Promise.all((pendingNotifications || []).map(async (item) => {
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

        // Send email here (implement your email sending logic)
        console.log(`Would send email to ${userEmail}: ${notification.title}`);
        
        // Here you would connect to your email service provider
        // For example, using SendGrid, Mailgun, etc.

        // Mark notification as sent
        const { error: updateError } = await supabase
          .from('notification_queue')
          .update({ 
            status: 'SENT',
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          throw new Error(`Failed to update notification status: ${updateError.message}`);
        }

        return { id: item.id, success: true };
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
