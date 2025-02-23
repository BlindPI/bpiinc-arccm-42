
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Input validation
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new Error('User ID is required in headers');
    }

    const { email, password, role, display_name } = await req.json();
    if (!email || !password || !role) {
      throw new Error('Email, password, and role are required');
    }

    console.log('Creating user with params:', {
      email,
      role,
      display_name,
      admin_user_id: userId
    });

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // First verify permissions through database function
    const { data: verificationData, error: verificationError } = await supabaseAdmin.rpc(
      'create_new_user',
      {
        admin_user_id: userId,
        email,
        initial_role: role,
        password,
        display_name: display_name || undefined
      }
    );

    if (verificationError) {
      console.error('Permission verification failed:', verificationError);
      throw new Error('Permission verification failed: ' + verificationError.message);
    }

    if (!verificationData?.[0]?.success) {
      console.error('Permission check response:', verificationData);
      throw new Error(verificationData?.[0]?.message || 'Permission verification failed');
    }

    console.log('Permission verification successful, creating user');

    // Create the user through Supabase Auth API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        display_name: display_name || email.split('@')[0],
        must_change_password: true
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created successfully:', {
      id: userData.user.id,
      email: userData.user.email,
      role
    });

    return new Response(
      JSON.stringify({
        user: userData.user,
        message: 'User created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 400,
      },
    );
  }
});
