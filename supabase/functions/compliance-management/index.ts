
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
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Fetching compliance data for user:', userId);

    // Fetch user's compliance status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('compliance_status, compliance_notes, last_compliance_check')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Get document counts
    const { data: documentCounts, error: documentError } = await supabase
      .from('document_submissions')
      .select('id')
      .eq('instructor_id', userId);

    if (documentError) {
      console.error('Error fetching documents:', documentError);
      throw documentError;
    }

    // Get required document count
    const { data: requiredDocs, error: requiredError } = await supabase
      .from('document_requirements')
      .select('id')
      .eq('from_role', profile?.role);

    if (requiredError) {
      console.error('Error fetching requirements:', requiredError);
      throw requiredError;
    }

    const complianceData = {
      isCompliant: profile?.compliance_status ?? false,
      notes: profile?.compliance_notes,
      lastCheck: profile?.last_compliance_check,
      submittedDocuments: documentCounts?.length ?? 0,
      requiredDocuments: requiredDocs?.length ?? 0
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
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
