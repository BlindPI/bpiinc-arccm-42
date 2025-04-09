
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    // Get request payload
    const { email, invitationLink } = await req.json();
    
    // Validate required fields
    if (!email || !invitationLink) {
      throw new Error('Email and invitation link are required');
    }

    // In a real application, send the invitation email here
    console.log(`Would send invitation email to ${email} with link: ${invitationLink}`);
    
    // Mock successful email sending
    // In production, you would use a real email service API here
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation email sent to ${email}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in send-invitation function:', error);
    
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
