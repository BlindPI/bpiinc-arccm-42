
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  console.log('Compliance management function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract userId from headers or URL params
    const userId = req.headers.get('x-user-id') || new URL(req.url).searchParams.get('userId');
    console.log('Processing request for user:', userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('compliance_status, compliance_notes, last_compliance_check')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    console.log('Profile data:', profile);

    // Get document submission counts
    const { count: submittedDocs, error: submittedError } = await supabase
      .from('document_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', userId)
      .eq('status', 'APPROVED');

    if (submittedError) {
      console.error('Error counting submitted documents:', submittedError);
      throw new Error(`Failed to count submitted documents: ${submittedError.message}`);
    }

    console.log('Submitted documents count:', submittedDocs);

    // Get required document count
    const { count: requiredDocs, error: requiredError } = await supabase
      .from('document_requirements')
      .select('*', { count: 'exact', head: true })
      .eq('is_mandatory', true);

    if (requiredError) {
      console.error('Error counting required documents:', requiredError);
      throw new Error(`Failed to count required documents: ${requiredError.message}`);
    }

    console.log('Required documents count:', requiredDocs);

    const complianceData = {
      isCompliant: profile?.compliance_status ?? false,
      notes: profile?.compliance_notes ?? null,
      lastCheck: profile?.last_compliance_check ?? null,
      submittedDocuments: submittedDocs ?? 0,
      requiredDocuments: requiredDocs ?? 0,
    };

    console.log('Returning compliance data:', complianceData);

    return new Response(
      JSON.stringify({ data: complianceData }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in compliance management:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Detailed error message:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: { 
          message: errorMessage
        }
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
})
