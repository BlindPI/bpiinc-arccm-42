
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserParams {
  email: string;
  password: string;
  role: string;
  display_name?: string;
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
    const params = await req.json() as CreateUserParams;
    console.log("Create user params:", { email: params.email, role: params.role, display_name: params.display_name });

    if (!params.email || !params.password || !params.role) {
      throw new Error("Missing required user parameters");
    }

    // Get the authenticated user making the request
    const { data: authData } = await supabase.auth.getUser();
    const requesterId = authData?.user?.id;
    
    if (!requesterId) {
      throw new Error("Unauthorized: You must be authenticated to create users");
    }

    // Check if requester has permission to create users
    const { data: adminCheck, error: adminCheckError } = await supabase.rpc(
      'create_new_user',
      { 
        admin_user_id: requesterId,
        email: params.email,
        initial_role: params.role,
        password: params.password,
        display_name: params.display_name
      }
    );

    if (adminCheckError) {
      throw adminCheckError;
    }

    if (!adminCheck.success) {
      throw new Error(adminCheck.message);
    }

    // Create the new user
    const { data: userData, error: createUserError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        display_name: params.display_name
      }
    });

    if (createUserError) {
      throw createUserError;
    }

    if (!userData.user) {
      throw new Error("Failed to create user");
    }

    // Set the user's role in the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: params.role,
        display_name: params.display_name
      })
      .eq('id', userData.user.id);

    if (profileError) {
      throw profileError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User created successfully", 
        user: userData.user 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error("Error in create-user function:", error);
    
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
