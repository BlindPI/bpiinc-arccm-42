
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseKey!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    switch (path) {
      case 'check':
        return await handleComplianceCheck(req)
      case 'update':
        return await handleComplianceUpdate(req)
      case 'verify':
        return await handleComplianceVerification(req)
      default:
        return new Response(
          JSON.stringify({ error: 'Not Found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleComplianceCheck(req: Request) {
  const { method } = req
  
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const instructorId = url.searchParams.get('instructorId')
  
  if (!instructorId) {
    return new Response(
      JSON.stringify({ error: 'Instructor ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('instructor_compliance_detail')
    .select('*')
    .eq('instructor_id', instructorId)
    .maybeSingle()

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleComplianceUpdate(req: Request) {
  const { method } = req
  
  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { instructor_id, is_compliant, compliance_notes } = await req.json()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      compliance_status: is_compliant,
      compliance_notes,
      last_compliance_check: new Date().toISOString()
    })
    .eq('id', instructor_id)
    .select()

  if (error) throw error

  // Log the compliance check
  await supabase
    .from('compliance_check_history')
    .insert({
      instructor_id,
      status: is_compliant,
      details: {
        notes: compliance_notes,
        checked_at: new Date().toISOString()
      }
    })

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleComplianceVerification(req: Request) {
  const { method } = req
  
  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { instructor_id } = await req.json()

  // Get instructor's current role and document requirements
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', instructor_id)
    .single()

  if (profileError) throw profileError

  // Get all document requirements for the current role
  const { data: requirements, error: reqError } = await supabase
    .from('document_requirements')
    .select('*')
    .eq('from_role', profile.role)

  if (reqError) throw reqError

  // Get submitted documents
  const { data: submissions, error: subError } = await supabase
    .from('document_submissions')
    .select('*')
    .eq('instructor_id', instructor_id)

  if (subError) throw subError

  // Check if all required documents are submitted and valid
  const isCompliant = requirements.every(req => {
    if (!req.is_mandatory) return true
    return submissions.some(sub => 
      sub.requirement_id === req.id && 
      sub.status === 'APPROVED' &&
      (!sub.expiry_date || new Date(sub.expiry_date) > new Date())
    )
  })

  // Update compliance status
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({
      compliance_status: isCompliant,
      last_compliance_check: new Date().toISOString()
    })
    .eq('id', instructor_id)
    .select()

  if (updateError) throw updateError

  return new Response(
    JSON.stringify({ data: updateData, isCompliant }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
