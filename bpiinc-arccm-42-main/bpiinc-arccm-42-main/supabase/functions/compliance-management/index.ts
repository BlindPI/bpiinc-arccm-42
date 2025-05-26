
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

// Handle CORS
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      throw new Error('Server configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get request data
    const { userId } = await req.json()
    
    if (!userId) {
      console.error('Missing userId in request body')
      throw new Error('Missing userId parameter')
    }

    console.log('Fetching compliance status for user:', userId)

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('compliance_status, compliance_notes, last_compliance_check')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw new Error('Could not fetch profile data')
    }

    // Get document submissions and requirements
    const { data: submissions, error: submissionsError } = await supabase
      .from('document_submissions')
      .select('*')
      .eq('instructor_id', userId)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      throw new Error('Could not fetch document submissions')
    }

    const { data: requirements, error: requirementsError } = await supabase
      .from('document_requirements')
      .select('*')

    if (requirementsError) {
      console.error('Error fetching requirements:', requirementsError)
      throw new Error('Could not fetch document requirements')
    }

    // Calculate document stats
    const submittedDocuments = submissions?.length || 0
    const requiredDocuments = requirements?.length || 0

    const complianceData = {
      isCompliant: profile?.compliance_status ?? false,
      notes: profile?.compliance_notes,
      lastCheck: profile?.last_compliance_check,
      submittedDocuments,
      requiredDocuments,
    }

    console.log('Returning compliance data:', complianceData)

    return new Response(JSON.stringify(complianceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in compliance-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
