
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ComplianceStatus {
  isCompliant: boolean;
  submittedDocuments: number;
  requiredDocuments: number;
  lastCheck: string;
  notes?: string;
}

interface ComplianceCheckRequest {
  userId: string;
  details?: {
    completedHours?: number;
    requiredHours?: number;
    documentsSubmitted?: number;
    documentsRequired?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client
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
      // Get compliance status
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('compliance_status, compliance_notes, last_compliance_check')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error(`Error fetching profile: ${profileError.message}`)
      }

      // Get document counts
      const { data: documentStats, error: docError } = await supabaseClient
        .from('document_submissions')
        .select('status')
        .eq('instructor_id', user.id)

      if (docError) {
        throw new Error(`Error fetching documents: ${docError.message}`)
      }

      const submittedDocuments = documentStats?.length || 0
      const requiredDocuments = 0 // You may want to fetch this from requirements table

      const response: ComplianceStatus = {
        isCompliant: profile?.compliance_status ?? false,
        submittedDocuments,
        requiredDocuments,
        lastCheck: profile?.last_compliance_check || new Date().toISOString(),
        notes: profile?.compliance_notes,
      }

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const input: ComplianceCheckRequest = await req.json()
      
      if (!input.userId) {
        throw new Error('Missing userId in request')
      }

      // Verify the user has permission to update compliance
      const { data: userRole } = await supabaseClient
        .rpc('get_user_role', { user_id: user.id })

      if (!['SA', 'AD', 'AP'].includes(userRole)) {
        throw new Error('Insufficient permissions to update compliance status')
      }

      // Update compliance check
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          compliance_status: true, // You may want to calculate this based on input.details
          last_compliance_check: new Date().toISOString(),
        })
        .eq('id', input.userId)

      if (updateError) {
        throw new Error(`Error updating compliance: ${updateError.message}`)
      }

      // Log compliance check
      const { error: logError } = await supabaseClient
        .from('compliance_check_history')
        .insert({
          instructor_id: input.userId,
          checked_by: user.id,
          status: true,
          details: input.details || {},
        })

      if (logError) {
        throw new Error(`Error logging compliance check: ${logError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Method ${req.method} not allowed`)
  } catch (error) {
    console.error('Error in compliance-management:', error)
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: error instanceof Error && error.message.includes('token') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

