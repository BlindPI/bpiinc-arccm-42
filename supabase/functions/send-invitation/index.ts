
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getInvitationEmailTemplate } from "../_shared/email-templates.ts";
import { Resend } from "https://esm.sh/resend@1.0.0";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);
    
    // Parse request data
    const { email, invitationToken, invitedBy, role } = await req.json();

    if (!email || !invitationToken) {
      throw new Error("Missing required parameters: email and invitationToken are required");
    }

    // Get inviter details if available
    let inviterName = "The Assured Response Team";
    if (invitedBy) {
      const { data: inviterData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', invitedBy)
        .single();
        
      if (inviterData?.display_name) {
        inviterName = inviterData.display_name;
      }
    }

    // Format role for display
    const roleDisplay = formatRoleForDisplay(role);
    
    // Generate acceptance URL
    const acceptUrl = `${req.headers.get('origin') || 'https://certtrainingtracker.com'}/accept-invitation?token=${invitationToken}`;
    
    // Try to get custom email template from database first
    const { data: customTemplate } = await supabase
      .from('location_email_templates')
      .select('subject_template, body_template')
      .eq('is_default', true)
      .single();
    
    let emailHtml: string;
    let emailSubject: string;
    
    if (customTemplate) {
      // Use custom template with variable substitution
      emailSubject = customTemplate.subject_template
        .replace(/\{\{role\}\}/g, roleDisplay)
        .replace(/\{\{inviter_name\}\}/g, inviterName);
        
      emailHtml = customTemplate.body_template
        .replace(/\{\{role\}\}/g, roleDisplay)
        .replace(/\{\{inviter_name\}\}/g, inviterName)
        .replace(/\{\{accept_url\}\}/g, acceptUrl)
        .replace(/\{\{invitation_token\}\}/g, invitationToken);
    } else {
      // Fallback to built-in template
      emailSubject = `You've Been Invited to Join Assured Response as ${roleDisplay}`;
      emailHtml = getInvitationEmailTemplate(inviterName, roleDisplay, acceptUrl);
    }
    
    // Send invitation email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Assured Response <invitations@certtrainingtracker.com>',
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });
    
    if (emailError) {
      throw emailError;
    }
    
    // Create notification record in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: null, // No user ID yet since they haven't registered
        title: `Invitation Sent to ${email}`,
        message: `An invitation has been sent to ${email} to join as ${roleDisplay}`,
        type: 'INFO',
        category: 'ACCOUNT',
        priority: 'NORMAL',
        read: false,
      });
      
    if (notificationError) {
      console.error("Error creating notification record:", notificationError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        email: emailData
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error("Error sending invitation:", error);
    
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

// Helper function to format role code for display
function formatRoleForDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Administrator Provisional',
    'AD': 'Administrator',
    'SA': 'System Administrator'
  };
  
  return roleMap[role] || role;
}
