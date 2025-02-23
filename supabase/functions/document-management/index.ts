
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentRequirement {
  id: string;
  document_type: string;
  is_mandatory: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const fromRole = url.searchParams.get('fromRole')
      const toRole = url.searchParams.get('toRole')

      if (!fromRole || !toRole) {
        throw new Error('Missing required role parameters')
      }

      // Fetch document requirements
      const { data: requirements, error: reqError } = await supabaseClient
        .from('document_requirements')
        .select('*')
        .eq('from_role', fromRole)
        .eq('to_role', toRole)

      if (reqError) {
        throw new Error(`Error fetching requirements: ${reqError.message}`)
      }

      return new Response(
        JSON.stringify(requirements),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { documentData, requirementId } = await req.json()

      if (!documentData || !requirementId) {
        throw new Error('Missing required fields')
      }

      // Validate the document requirement exists
      const { data: requirement, error: reqError } = await supabaseClient
        .from('document_requirements')
        .select('*')
        .eq('id', requirementId)
        .single()

      if (reqError || !requirement) {
        throw new Error('Invalid document requirement')
      }

      // Create document submission
      const { data: submission, error: subError } = await supabaseClient
        .from('document_submissions')
        .insert({
          instructor_id: user.id,
          requirement_id: requirementId,
          document_url: documentData.url,
          status: 'PENDING',
          expiry_date: documentData.expiryDate || null,
        })
        .select()
        .single()

      if (subError) {
        throw new Error(`Error creating submission: ${subError.message}`)
      }

      return new Response(
        JSON.stringify(submission),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Method ${req.method} not allowed`)
  } catch (error) {
    console.error('Error in document-management:', error)
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: error instanceof Error && 
          (error.message.includes('token') ? 401 : 
           error.message.includes('Missing required') ? 400 : 500),
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

