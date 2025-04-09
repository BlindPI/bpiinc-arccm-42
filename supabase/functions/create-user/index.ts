
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
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

    // Get the user ID from the request header
    const adminUserId = req.headers.get('x-user-id');
    if (!adminUserId) {
      throw new Error('User ID is required in the header');
    }

    // Get request payload
    const { email, password, role, display_name } = await req.json();

    // Validate required fields
    if (!email || !password || !role) {
      throw new Error('Email, password, and role are required');
    }

    // Check if admin has permission
    const { data: adminUserRole, error: roleError } = await supabase.rpc('get_user_role', {
      user_id: adminUserId
    });

    if (roleError) {
      throw new Error(`Error checking admin role: ${roleError.message}`);
    }

    if (!adminUserRole || !['SA', 'AD'].includes(adminUserRole)) {
      throw new Error('Only system administrators and admins can create users');
    }

    // Don't allow non-SA to create SA
    if (role === 'SA' && adminUserRole !== 'SA') {
      throw new Error('Only system administrators can create other system administrators');
    }

    // Create the user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: display_name || email.split('@')[0]
      }
    });

    if (createError) {
      throw new Error(`Error creating user: ${createError.message}`);
    }

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Update the profile with the role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role,
        display_name: display_name || email.split('@')[0]
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail - the trigger should have created a default profile
    }

    return new Response(
      JSON.stringify({ success: true, user }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    
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
