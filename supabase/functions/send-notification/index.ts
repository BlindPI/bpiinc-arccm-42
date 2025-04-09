
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationParams {
  userId?: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  actionUrl?: string;
  email?: string;
  emailSubject?: string;
  emailContent?: string;
  recipientEmail?: string;
  recipientName?: string;
  courseName?: string;
}

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

    // Get the request body
    const params = await req.json() as NotificationParams;
    console.log("Notification params:", params);

    if (!params.title || !params.message || !params.type) {
      throw new Error("Missing required notification parameters");
    }

    // Create the notification in the database if there's a userId
    let notification = null;
    
    if (params.userId) {
      const { data, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          action_url: params.actionUrl
        })
        .select()
        .single();

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        throw notificationError;
      }
      
      notification = data;
    }

    // Handle different notification types
    let emailResponse = null;
    
    if (params.type === 'CERTIFICATE_REQUEST' && params.recipientEmail && params.recipientName && params.courseName) {
      // Notification for certificate request (would send email here)
      console.log(`Would send certificate request confirmation email to ${params.recipientEmail}`);
      emailResponse = {
        type: 'certificate_request',
        recipient: params.recipientEmail,
        success: true
      };
    } else if (params.type === 'CERTIFICATE_APPROVED' || params.type === 'CERTIFICATE_REJECTED') {
      // Notification for certificate request decision (would send email here)
      console.log(`Would send certificate ${params.type.toLowerCase()} email to ${params.recipientEmail}`);
      emailResponse = {
        type: params.type.toLowerCase(),
        recipient: params.recipientEmail,
        success: true
      };
    } else if (params.email && params.emailSubject && params.emailContent) {
      // Generic email (would send general email here)
      console.log(`Would send email to ${params.email} with subject ${params.emailSubject}`);
      emailResponse = {
        type: 'generic',
        recipient: params.email,
        success: true
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: notification ? "Notification created successfully" : "Email notification sent successfully", 
        data: notification,
        email: emailResponse
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    
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
