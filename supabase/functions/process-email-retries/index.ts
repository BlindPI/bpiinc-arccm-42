import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRetryQueueRequest {
  processQueue: boolean;
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

    const body: ProcessRetryQueueRequest = await req.json();
    
    if (!body.processQueue) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Processing email retry queue...');

    // Get pending retries that are ready to be processed
    const { data: retries, error: retriesError } = await supabase
      .from('email_retry_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(50);

    if (retriesError) {
      throw retriesError;
    }

    console.log(`Found ${retries?.length || 0} retries to process`);

    let processed = 0;
    let failed = 0;

    for (const retry of retries || []) {
      try {
        console.log(`Processing retry ${retry.id} for certificate ${retry.certificate_id}`);

        // Mark as processing
        await supabase
          .from('email_retry_queue')
          .update({ status: 'processing' })
          .eq('id', retry.id);

        // Get certificate data
        const { data: certificate, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', retry.certificate_id)
          .single();

        if (certError || !certificate) {
          throw new Error(`Certificate not found: ${retry.certificate_id}`);
        }

        // Call certificate email function for retry
        const { error: functionError } = await supabase.functions.invoke('send-certificate-email', {
          body: { 
            certificateId: retry.certificate_id, 
            isRetry: true,
            retryCount: retry.retry_count
          }
        });

        if (functionError) {
          throw functionError;
        }

        // Mark as completed
        await supabase
          .from('email_retry_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', retry.id);

        processed++;
        console.log(`Successfully processed retry ${retry.id}`);

      } catch (error) {
        console.error(`Error processing retry ${retry.id}:`, error);
        
        const maxRetries = 3;
        
        if (retry.retry_count >= maxRetries) {
          // Mark as failed permanently
          await supabase
            .from('email_retry_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', retry.id);
            
          console.log(`Retry ${retry.id} marked as permanently failed after ${maxRetries} attempts`);
        } else {
          // Schedule another retry with exponential backoff
          const backoffMinutes = Math.pow(2, retry.retry_count) * 30; // 30min, 1hr, 2hr
          const nextRetryAt = new Date();
          nextRetryAt.setMinutes(nextRetryAt.getMinutes() + backoffMinutes);

          // Create new retry entry
          await supabase
            .from('email_retry_queue')
            .insert({
              certificate_id: retry.certificate_id,
              retry_count: retry.retry_count + 1,
              next_retry_at: nextRetryAt.toISOString(),
              status: 'pending'
            });

          // Mark current retry as failed
          await supabase
            .from('email_retry_queue')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', retry.id);
            
          console.log(`Scheduled retry ${retry.retry_count + 1} for certificate ${retry.certificate_id} at ${nextRetryAt.toISOString()}`);
        }
        
        failed++;
      }
    }

    // Check bounce rates and create alerts if needed
    console.log('Checking bounce rates for alerts...');
    
    const { data: domainStats, error: domainError } = await supabase.rpc('get_domain_bounce_rates', {
      hours_back: 24
    });

    if (!domainError && domainStats) {
      for (const domain of domainStats) {
        if (domain.bounce_rate > 10 && domain.total_emails > 10) {
          // Check if we already have a recent alert for this domain
          const { data: existingAlert } = await supabase
            .from('email_delivery_alerts')
            .select('id')
            .eq('alert_type', 'high_bounce_rate')
            .eq('metadata->>domain', domain.domain)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingAlert) {
            await supabase
              .from('email_delivery_alerts')
              .insert({
                alert_type: 'high_bounce_rate',
                severity: domain.bounce_rate > 20 ? 'critical' : 'high',
                message: `High bounce rate detected for ${domain.domain}: ${domain.bounce_rate}%`,
                metadata: {
                  domain: domain.domain,
                  bounce_rate: domain.bounce_rate,
                  total_emails: domain.total_emails,
                  bounced_emails: domain.bounced_emails
                }
              });
              
            console.log(`Created bounce rate alert for domain ${domain.domain}: ${domain.bounce_rate}%`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        failed,
        total: retries?.length || 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error processing retry queue:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process retry queue' }),
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