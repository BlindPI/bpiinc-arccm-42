import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarSyncRequest {
  integration_id: string
  operation: 'sync_availability' | 'export_events' | 'import_events'
  start_date?: string
  end_date?: string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { integration_id, operation, start_date, end_date }: CalendarSyncRequest = await req.json()

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('external_calendar_integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integration not found')
    }

    if (!integration.sync_enabled) {
      throw new Error('Sync is disabled for this integration')
    }

    // Mock calendar sync operation
    const mockResult = {
      success: true,
      imported: Math.floor(Math.random() * 10),
      exported: Math.floor(Math.random() * 5),
      conflicts: Math.floor(Math.random() * 2),
      errors: []
    }

    // Create sync event record
    await supabaseClient
      .from('calendar_sync_events')
      .insert({
        integration_id,
        sync_type: operation,
        sync_status: 'completed',
        events_processed: mockResult.imported + mockResult.exported,
        conflicts_detected: mockResult.conflicts,
        sync_details: mockResult,
        last_synced_at: new Date().toISOString()
      })

    // Update integration last sync
    await supabaseClient
      .from('external_calendar_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'active'
      })
      .eq('id', integration_id)

    return new Response(JSON.stringify(mockResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

serve(handler)