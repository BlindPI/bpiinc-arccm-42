
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
      case 'audit-forms':
        return await handleAuditForms(req)
      case 'skill-videos':
        return await handleSkillVideos(req)
      case 'compliance':
        return await handleComplianceDocuments(req)
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

async function handleAuditForms(req: Request) {
  const { method } = req
  
  switch (method) {
    case 'GET': {
      const url = new URL(req.url)
      const transitionRequestId = url.searchParams.get('transitionRequestId')
      
      if (!transitionRequestId) {
        return new Response(
          JSON.stringify({ error: 'Transition request ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('role_audit_submissions')
        .select('*')
        .eq('transition_request_id', transitionRequestId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handleSkillVideos(req: Request) {
  const { method } = req
  
  switch (method) {
    case 'GET': {
      const url = new URL(req.url)
      const instructorId = url.searchParams.get('instructorId')
      
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: 'Instructor ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('instructor_id', instructorId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    case 'POST': {
      const body = await req.json()
      const { data, error } = await supabase
        .from('video_submissions')
        .insert(body)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handleComplianceDocuments(req: Request) {
  const { method } = req
  
  switch (method) {
    case 'GET': {
      const url = new URL(req.url)
      const instructorId = url.searchParams.get('instructorId')
      
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: 'Instructor ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('document_submissions')
        .select('*, document_requirements(*)')
        .eq('instructor_id', instructorId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}
