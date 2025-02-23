
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

interface ComplianceData {
  isCompliant: boolean;
  notes?: string;
  lastCheck?: string;
  submittedDocuments: number;
  requiredDocuments: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user info from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    // Get latest compliance check
    const { data: profiles, error: profileError } = await supabaseClient
      .from('compliance_check_history')
      .select('status, details, check_date')
      .eq('instructor_id', user.id)
      .order('check_date', { ascending: false })
      .limit(1)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Error fetching compliance check:', profileError);
      throw new Error(`Failed to fetch compliance check: ${profileError.message}`);
    }

    // Get document submission counts
    const { count: submittedDocs, error: submittedError } = await supabaseClient
      .from('document_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', user.id)
      .eq('status', 'APPROVED');

    if (submittedError) {
      console.error('Error counting submitted documents:', submittedError);
      throw new Error(`Failed to count submitted documents: ${submittedError.message}`);
    }

    // Get required documents count based on current role
    const { data: userProfile, error: userProfileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfileError) {
      console.error('Error fetching user profile:', userProfileError);
      throw new Error(`Failed to fetch user profile: ${userProfileError.message}`);
    }

    const { count: requiredDocs, error: requiredError } = await supabaseClient
      .from('document_requirements')
      .select('*', { count: 'exact', head: true })
      .eq('required_for_role', userProfile.role);

    if (requiredError) {
      console.error('Error counting required documents:', requiredError);
      throw new Error(`Failed to count required documents: ${requiredError.message}`);
    }

    const complianceData: ComplianceData = {
      isCompliant: profiles?.status ?? false,
      notes: profiles?.details?.notes,
      lastCheck: profiles?.check_date,
      submittedDocuments: submittedDocs || 0,
      requiredDocuments: requiredDocs || 0,
    };

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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
