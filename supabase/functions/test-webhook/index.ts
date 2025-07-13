import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookTestRequest {
  webhook_id: string
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

    const { webhook_id }: WebhookTestRequest = await req.json()

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('webhook_configurations')
      .select('*')
      .eq('id', webhook_id)
      .single()

    if (webhookError || !webhook) {
      throw new Error('Webhook not found')
    }

    // Test the webhook endpoint
    const testPayload = {
      type: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from your Availability Management System'
      }
    }

    try {
      const response = await fetch(webhook.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      })

      const success = response.ok
      
      // Update webhook with test result
      await supabaseClient
        .from('webhook_configurations')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_response_status: response.status,
          is_active: success
        })
        .eq('id', webhook_id)

      return new Response(JSON.stringify({
        success,
        status: response.status,
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (fetchError: any) {
      // Update webhook with error
      await supabaseClient
        .from('webhook_configurations')
        .update({
          last_triggered_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', webhook_id)

      return new Response(JSON.stringify({
        success: false,
        error: `Connection failed: ${fetchError.message}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

  } catch (error: any) {
    console.error('Webhook test error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

serve(handler)