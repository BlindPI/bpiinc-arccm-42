
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    switch (path) {
      case 'teaching-hours':
        return await handleTeachingHours(req)
      case 'course-completions':
        return await handleCourseCompletions(req)
      case 'supervisor-evaluations':
        return await handleSupervisorEvaluations(req)
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

async function handleTeachingHours(req: Request) {
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
        .from('teaching_sessions')
        .select('*')
        .eq('instructor_id', instructorId)

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    case 'POST': {
      const { instructor_id, hours_taught, session_date, course_id, completion_status } = await req.json()
      
      const { data, error } = await supabase
        .from('teaching_sessions')
        .insert({
          instructor_id,
          hours_taught,
          session_date,
          course_id,
          completion_status
        })
        .select()
        .single()

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

async function handleCourseCompletions(req: Request) {
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
    .from('course_completion_summary')
    .select('*')
    .eq('instructor_id', instructorId)

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleSupervisorEvaluations(req: Request) {
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
        .from('supervisor_evaluations')
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
        .from('supervisor_evaluations')
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
