
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

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
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get userId from URL parameters
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      throw new Error('Missing userId parameter')
    }

    console.log('Fetching compliance status for user:', userId)

    // Get profile and document submissions for user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('compliance_status, compliance_notes, last_compliance_check')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw new Error('Error fetching profile data')
    }

    const { data: documents, error: documentsError } = await supabase
      .from('document_submissions')
      .select('*')
      .eq('instructor_id', userId)

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      throw new Error('Error fetching document data')
    }

    // Calculate document stats
    const submittedDocuments = documents?.length || 0
    const approvedDocuments = documents?.filter(doc => doc.status === 'APPROVED').length || 0

    const complianceData = {
      isCompliant: profile?.compliance_status ?? false,
      notes: profile?.compliance_notes || undefined,
      lastCheck: profile?.last_compliance_check,
      submittedDocuments: submittedDocuments,
      requiredDocuments: submittedDocuments, // This should be updated based on your requirements
    }

    console.log('Returning compliance data:', complianceData)

    return new Response(JSON.stringify(complianceData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in compliance-management function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})

