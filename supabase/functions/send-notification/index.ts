
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notification } = await req.json();
    
    if (!notification) {
      throw new Error('Notification data is required');
    }

    const { user_id, title, message, type = 'INFO', action_url } = notification;
    
    if (!title || !message) {
      throw new Error('Title and message are required fields');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Insert notification into database
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        action_url,
        read: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Notification created:', data);

    // If email notification is required, you can add that logic here
    // This would integrate with an email service like SendGrid, AWS SES, etc.

    return new Response(
      JSON.stringify({
        id: data.id,
        message: 'Notification sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send notification'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
