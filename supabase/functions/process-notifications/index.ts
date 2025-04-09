
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function will be triggered on a schedule to process notifications
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get pending notifications from the queue
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from('notification_queue')
      .select(`
        *,
        notifications:notification_id (
          *,
          recipient:user_id (
            email
          )
        )
      `)
      .eq('status', 'PENDING')
      .limit(10);

    if (queueError) throw queueError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processed = [];
    const failed = [];

    // Process each notification
    for (const item of queueItems) {
      try {
        // For now, just mark as sent - in a real implementation, send actual emails
        // This would connect to an email service like SendGrid or similar
        console.log(`Processing notification: ${item.notification_id}`);
        console.log(`Would send email to: ${item.notifications?.recipient?.email}`);
        
        // Update notification status
        const { error } = await supabaseAdmin
          .from('notification_queue')
          .update({ 
            status: 'SENT',
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (error) throw error;
        processed.push(item.id);
      } catch (error) {
        console.error(`Error processing notification ${item.id}:`, error);
        
        // Update with error status
        await supabaseAdmin
          .from('notification_queue')
          .update({ 
            status: 'FAILED',
            processed_at: new Date().toISOString(),
            error: error.message 
          })
          .eq('id', item.id);
        
        failed.push(item.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processed.length + failed.length} notifications`,
        summary: {
          success: processed.length,
          failed: failed.length
        }
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error in process-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});
