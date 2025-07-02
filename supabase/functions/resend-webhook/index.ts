import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id: string;
    to: string;
    from: string;
    subject: string;
    created_at: string;
    status?: string;
    bounce?: {
      type: string;
      reason: string;
    };
    complaint?: {
      type: string;
      reason: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const event: ResendWebhookEvent = await req.json();
    console.log('Received webhook event:', event);

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.clicked': 'clicked',
      'email.opened': 'opened',
      'email.delivery_delayed': 'delayed'
    };

    const eventType = eventTypeMap[event.type] || event.type;
    
    // Extract certificate ID from subject or metadata if available
    // This assumes certificate emails have a specific format
    const certificateIdMatch = event.data.subject?.match(/Certificate\s+([a-f0-9-]{36})/i);
    let certificateId: string | null = null;
    
    if (certificateIdMatch) {
      certificateId = certificateIdMatch[1];
    } else {
      // Try to find certificate by email if no ID in subject
      const { data: certificate } = await supabase
        .from('certificates')
        .select('id')
        .eq('email', event.data.to)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      certificateId = certificate?.id || null;
    }

    // Create delivery event record
    const { error: eventError } = await supabase
      .from('email_delivery_events')
      .insert({
        certificate_id: certificateId,
        event_type: eventType,
        resend_email_id: event.data.email_id,
        recipient_email: event.data.to,
        subject: event.data.subject,
        status: event.data.status || eventType,
        bounce_reason: event.data.bounce?.reason || event.data.complaint?.reason,
        error_message: event.data.bounce?.type || event.data.complaint?.type,
        metadata: {
          from: event.data.from,
          created_at: event.data.created_at,
          original_event: event
        }
      });

    if (eventError) {
      console.error('Error inserting delivery event:', eventError);
    }

    // Update certificate delivery status if we found a matching certificate
    if (certificateId) {
      let deliveryStatus = 'sent';
      let bounceReason = null;

      switch (eventType) {
        case 'delivered':
          deliveryStatus = 'delivered';
          break;
        case 'bounced':
          deliveryStatus = 'bounced';
          bounceReason = event.data.bounce?.reason || 'Email bounced';
          break;
        case 'complained':
          deliveryStatus = 'failed';
          bounceReason = event.data.complaint?.reason || 'Spam complaint';
          break;
        case 'delayed':
          deliveryStatus = 'pending';
          break;
      }

      const updateData: any = {
        delivery_status: deliveryStatus,
        last_delivery_attempt: new Date().toISOString()
      };

      if (bounceReason) {
        updateData.bounce_reason = bounceReason;
      }

      // Increment delivery attempts for failed deliveries
      if (['bounced', 'failed'].includes(deliveryStatus)) {
        const { data: currentCert } = await supabase
          .from('certificates')
          .select('delivery_attempts')
          .eq('id', certificateId)
          .single();

        updateData.delivery_attempts = (currentCert?.delivery_attempts || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('certificates')
        .update(updateData)
        .eq('id', certificateId);

      if (updateError) {
        console.error('Error updating certificate delivery status:', updateError);
      } else {
        console.log(`Updated certificate ${certificateId} status to ${deliveryStatus}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: eventType }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);