
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

interface ComplianceData {
  isCompliant: boolean;
  notes?: string;
  lastCheck: string;
  submittedDocuments: number;
  requiredDocuments: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the JWT from the request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get user's profile to check their role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      throw new Error('Could not fetch user profile')
    }

    // Get compliance data for the user
    const { data: complianceData, error: complianceError } = await supabaseClient
      .from('instructor_compliance')
      .select('*')
      .eq('instructor_id', user.id)
      .single()

    if (complianceError) {
      console.error('Error fetching compliance data:', complianceError)
      throw new Error('Could not fetch compliance data')
    }

    // If no compliance data exists, create a new record
    if (!complianceData) {
      const { data: newCompliance, error: createError } = await supabaseClient
        .from('instructor_compliance')
        .insert([
          {
            instructor_id: user.id,
            instructor_role: profile.role,
            is_compliant: true, // Default to compliant
            completed_teaching_hours: 0,
            required_teaching_hours: 0,
            submitted_documents_count: 0,
            required_documents_count: 0
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Error creating compliance data:', createError)
        throw new Error('Could not create compliance data')
      }

      return new Response(
        JSON.stringify({
          isCompliant: true,
          notes: null,
          lastCheck: new Date().toISOString(),
          submittedDocuments: 0,
          requiredDocuments: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Return the formatted compliance data
    const response: ComplianceData = {
      isCompliant: complianceData.is_compliant,
      notes: complianceData.compliance_notes,
      lastCheck: complianceData.last_compliance_check,
      submittedDocuments: complianceData.submitted_documents_count,
      requiredDocuments: complianceData.required_documents_count
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in compliance-management function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
