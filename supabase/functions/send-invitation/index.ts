
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getInvitationEmailTemplate, getInvitationEmailTemplateText } from "../_shared/email-templates.ts";
import { Resend } from "npm:resend@2.0.0";

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
    // Initialize environment variables with validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    console.log("🔍 Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendKey: !!resendApiKey
    });
    
    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      const missing = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!supabaseKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!resendApiKey) missing.push("RESEND_API_KEY");
      
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("🔍 Initializing Resend client...");
    const resend = new Resend(resendApiKey);
    console.log("🔍 Resend client initialized successfully");
    
    // Parse request data
    const { email, invitationToken, invitedBy, role } = await req.json();

    console.log(`🔍 Processing invitation request:`, {
      email,
      role,
      hasInvitedBy: !!invitedBy,
      hasToken: !!invitationToken
    });

    if (!email || !role) {
      throw new Error("Missing required parameters: email and role are required");
    }

    // Generate invitation token if not provided
    let finalInvitationToken = invitationToken;
    if (!finalInvitationToken) {
      console.log('🔍 Generating new invitation token...');
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
      
      if (tokenError) {
        console.error("🔍 Error generating token:", tokenError);
        throw tokenError;
      }
      finalInvitationToken = tokenData;
      console.log('🔍 Token generated successfully');
    }

    // Create user invitation in database - using service role to bypass RLS
    console.log('🔍 Creating invitation record in database...');
    const { data: invitationData, error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        initial_role: role,
        invitation_token: finalInvitationToken,
        invited_by: invitedBy,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();
    
    if (invitationError) {
      console.error("🔍 Error creating invitation:", invitationError);
      throw invitationError;
    }

    console.log('🔍 Successfully created invitation record');

    // Get inviter details if available - using service role to bypass RLS
    let inviterName = "The Assured Response Team";
    if (invitedBy) {
      console.log(`🔍 Looking up inviter: ${invitedBy}`);
      const { data: inviterData, error: inviterError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', invitedBy)
        .single();
        
      if (inviterError) {
        console.warn(`🔍 Could not fetch inviter details: ${inviterError.message}`);
      } else if (inviterData?.display_name) {
        inviterName = inviterData.display_name;
        console.log(`🔍 Found inviter: ${inviterName}`);
      }
    }

    // Format role for display
    const roleDisplay = formatRoleForDisplay(role);
    
    // Use domain-consistent URL for acceptance
    const acceptUrl = `https://mail.bpiincworks.com/accept-invitation?token=${finalInvitationToken}`;
    
    console.log(`🔍 Generated accept URL: ${acceptUrl}`);
    
    // Generate email content with both HTML and plain text versions
    const emailSubject = `You've Been Invited to Join Assured Response as ${roleDisplay}`;
    const emailHtml = getInvitationEmailTemplate(inviterName, roleDisplay, acceptUrl);
    const emailText = getInvitationEmailTemplateText(inviterName, roleDisplay, acceptUrl);
    
    console.log(`🔍 Sending invitation email with subject: ${emailSubject}`);
    console.log(`🔍 Using verified domain: mail.bpiincworks.com`);
    
    // Send invitation email using Resend with both HTML and text versions
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Assured Response <invitations@mail.bpiincworks.com>',
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@mail.bpiincworks.com>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    
    if (emailError) {
      console.error("🔍 Resend email error:", emailError);
      throw emailError;
    }
    
    console.log("🔍 Email sent successfully via Resend:", emailData?.id);
    
    // Create notification record in database - using service role to bypass RLS
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
      console.error("🔍 Error creating notification record:", notificationError);
      // Don't fail the whole operation for notification errors
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        email: emailData,
        domain: 'mail.bpiincworks.com'
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
    console.error("🔍 Error sending invitation:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack || 'No stack trace available'
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
