import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkNotificationRequest {
  notifications: Array<{
    type: string
    userId: string
    title: string
    message: string
    data?: Record<string, any>
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  }>
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

    const { notifications }: BulkNotificationRequest = await req.json()

    let successCount = 0
    let failedCount = 0

    // Process notifications in batches
    const batchSize = 10
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      
      const promises = batch.map(async (notification) => {
        try {
          // Get user's notification preferences
          const { data: preferences } = await supabaseClient
            .from('notification_preferences')
            .select('*')
            .eq('user_id', notification.userId)
            .eq('notification_type', notification.type)

          // Create delivery log entries
          const deliveryPromises = (preferences || []).filter(p => p.enabled).map(pref => 
            supabaseClient
              .from('notification_delivery_log')
              .insert({
                user_id: notification.userId,
                notification_type: notification.type,
                delivery_method: pref.delivery_method,
                recipient: pref.delivery_method === 'email' ? 'user@example.com' : '+1234567890',
                subject: notification.title,
                content: notification.message,
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                metadata: notification.data || {}
              })
          )

          await Promise.all(deliveryPromises)
          return true
        } catch (error) {
          console.error('Failed to send notification:', error)
          return false
        }
      })

      const results = await Promise.all(promises)
      successCount += results.filter(Boolean).length
      failedCount += results.filter(r => !r).length
    }

    return new Response(JSON.stringify({ 
      success: successCount, 
      failed: failedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Bulk notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

serve(handler)