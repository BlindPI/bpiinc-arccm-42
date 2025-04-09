
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
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request payload
    const payload = await req.json();
    console.log("Received notification request:", payload);

    const { 
      user_id,
      recipientEmail, 
      recipientName,
      title, 
      message, 
      type, 
      action_url, 
      send_email = false,
      courseName,
      rejectionReason
    } = payload;

    // Prepare notification data
    const notificationData = {
      user_id,
      title: title || "System Notification",
      message,
      type: type || "INFO",
      action_url,
      read: false,
      created_at: new Date().toISOString()
    };

    // Insert the notification into the database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    console.log("Notification created:", notification);

    // If email sending is requested, invoke the process-notifications function
    if (send_email && recipientEmail) {
      // Queue an email notification
      try {
        // This would be replaced with a call to your email service
        console.log(`Would send email to ${recipientEmail} with subject "${title}"`);
        
        // Example integration with a hypothetical email service or queue
        if (type === 'CERTIFICATE_APPROVED') {
          console.log(`Certificate approved email for ${recipientName} - Course: ${courseName}`);
        } else if (type === 'CERTIFICATE_REJECTED') {
          console.log(`Certificate rejected email for ${recipientName} - Course: ${courseName} - Reason: ${rejectionReason}`);
        } else if (type === 'CERTIFICATE_REQUEST') {
          console.log(`New certificate request email for ${recipientName} - Course: ${courseName}`);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // We don't throw here, as we still created the in-app notification successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: notification 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
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
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
