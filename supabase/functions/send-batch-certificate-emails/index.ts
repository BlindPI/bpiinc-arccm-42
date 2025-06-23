
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchEmailRequest {
  certificateIds: string[];
  batchId: string;
  customMessage?: string;
  userId?: string;
}

interface EmailResult {
  certificateId: string;
  success: boolean;
  emailId?: string;
  error?: string;
  retryCount?: number;
}

// Rate limiting configuration
const RATE_LIMIT_DELAY = 600; // 600ms between emails (under 2/second limit)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const exponentialBackoff = (attempt: number, baseDelay: number = INITIAL_RETRY_DELAY): number => {
  return baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Add jitter
};

serve(async (req) => {
  console.log('=== Batch Certificate Email Function Started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY')!;

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendKey: !!resendKey
    });

    if (!resendKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    const { certificateIds, batchId, customMessage, userId }: BatchEmailRequest = await req.json();
    
    console.log('Request payload:', {
      certificateIds: certificateIds.length,
      batchId,
      userId
    });

    if (!certificateIds || certificateIds.length === 0) {
      throw new Error('No certificate IDs provided');
    }

    // Update batch status to PROCESSING
    console.log('Updating batch status to PROCESSING');
    await supabase
      .from('email_batch_operations')
      .update({ 
        status: 'PROCESSING',
        processed_certificates: 0,
        successful_emails: 0,
        failed_emails: 0
      })
      .eq('id', batchId);

    // Fetch certificates with location data for templates
    console.log('Fetching certificates with location data...');
    const { data: certificates, error: fetchError } = await supabase
      .from('certificates')
      .select(`
        id,
        recipient_name,
        recipient_email,
        course_name,
        issue_date,
        expiry_date,
        verification_code,
        certificate_url,
        location_id,
        locations:location_id (
          id,
          name
        )
      `)
      .in('id', certificateIds);

    if (fetchError) {
      throw new Error(`Failed to fetch certificates: ${fetchError.message}`);
    }

    console.log(`Found ${certificates.length} certificates`);

    const emailResults: EmailResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process emails with rate limiting and retry logic
    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      console.log(`Processing certificate ${cert.id} for ${cert.recipient_name}`);

      if (!cert.recipient_email) {
        console.log(`Skipping ${cert.recipient_name} - no email address`);
        emailResults.push({
          certificateId: cert.id,
          success: false,
          error: 'No email address provided'
        });
        failedCount++;
        continue;
      }

      const result = await sendEmailWithRetry(
        resend, 
        cert, 
        customMessage,
        supabase
      );

      emailResults.push(result);

      if (result.success) {
        successCount++;
        console.log(`Email sent for ${cert.recipient_name}: success`);
      } else {
        failedCount++;
        console.log(`Email failed for ${cert.recipient_name}: ${result.error}`);
      }

      // Update progress
      await supabase
        .from('email_batch_operations')
        .update({
          processed_certificates: i + 1,
          successful_emails: successCount,
          failed_emails: failedCount
        })
        .eq('id', batchId);

      console.log(`Progress updated: ${i + 1}/${certificates.length} (${successCount} success, ${failedCount} failed)`);

      // Rate limiting delay (except for last email)
      if (i < certificates.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    // Finalize batch operation
    console.log('Finalizing batch operation...');
    const finalStatus = failedCount === 0 ? 'COMPLETED' : 'COMPLETED';
    const errorMessage = failedCount > 0 ? `${failedCount} emails failed to send` : null;

    await supabase
      .from('email_batch_operations')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', batchId);

    console.log('=== Batch Email Process Complete ===');
    console.log(`Final stats: ${successCount} success, ${failedCount} failed, ${certificates.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        results: emailResults,
        summary: {
          total: certificates.length,
          successful: successCount,
          failed: failedCount
        }
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Batch email error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});

async function sendEmailWithRetry(
  resend: any,
  certificate: any,
  customMessage?: string,
  supabase?: any
): Promise<EmailResult> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // If this is a retry attempt, wait with exponential backoff
      if (attempt > 0) {
        const backoffDelay = exponentialBackoff(attempt - 1);
        console.log(`Retry attempt ${attempt} for ${certificate.recipient_name} after ${backoffDelay}ms`);
        await delay(backoffDelay);
      }

      const emailResult = await sendSingleEmail(resend, certificate, customMessage, supabase);
      
      if (emailResult.success) {
        return {
          certificateId: certificate.id,
          success: true,
          emailId: emailResult.emailId,
          retryCount: attempt
        };
      } else {
        lastError = emailResult.error;
        
        // Check if this is a rate limit error
        if (emailResult.error?.statusCode === 429 || 
            emailResult.error?.name === 'rate_limit_exceeded') {
          console.log(`Rate limit hit for ${certificate.recipient_name}, attempt ${attempt + 1}`);
          continue; // Retry for rate limit errors
        } else {
          // For non-rate-limit errors, don't retry
          break;
        }
      }
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed for ${certificate.recipient_name}:`, error);
    }
  }

  return {
    certificateId: certificate.id,
    success: false,
    error: lastError?.message || lastError?.toString() || 'Unknown error',
    retryCount: MAX_RETRIES
  };
}

async function sendSingleEmail(
  resend: any,
  certificate: any,
  customMessage?: string,
  supabase?: any
): Promise<{ success: boolean; emailId?: string; error?: any }> {
  try {
    // Get email template from location_email_templates table
    let template = null;
    if (certificate.location_id && supabase) {
      const { data: templates } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('location_id', certificate.location_id)
        .eq('is_default', true)
        .limit(1);
      
      if (templates && templates.length > 0) {
        template = templates[0];
      }
    }

    const locationName = certificate.locations?.name || 'Your Training Provider';
    
    const subject = template?.subject_template?.replace(/\{\{recipient_name\}\}/g, certificate.recipient_name)
                                               .replace(/\{\{course_name\}\}/g, certificate.course_name)
                                               .replace(/\{\{location_name\}\}/g, locationName) ||
                   `Your ${certificate.course_name} Certificate`;

    let emailBody = '';
    if (template?.body_template) {
      emailBody = template.body_template
        .replace(/\{\{recipient_name\}\}/g, certificate.recipient_name)
        .replace(/\{\{course_name\}\}/g, certificate.course_name)
        .replace(/\{\{location_name\}\}/g, locationName)
        .replace(/\{\{issue_date\}\}/g, new Date(certificate.issue_date).toLocaleDateString())
        .replace(/\{\{expiry_date\}\}/g, new Date(certificate.expiry_date).toLocaleDateString())
        .replace(/\{\{verification_code\}\}/g, certificate.verification_code);
    } else {
      emailBody = `
        <h1>Your ${certificate.course_name} Certificate</h1>
        <p>Dear ${certificate.recipient_name},</p>
        <p>Congratulations! Your certificate for ${certificate.course_name} is now ready.</p>
        <p><strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString()}</p>
        <p><strong>Expiry Date:</strong> ${new Date(certificate.expiry_date).toLocaleDateString()}</p>
        <p><strong>Verification Code:</strong> ${certificate.verification_code}</p>
        ${certificate.certificate_url ? `<p><a href="${certificate.certificate_url}">Download your certificate</a></p>` : ''}
        <p>Best regards,<br>${locationName}</p>
      `;
    }

    if (customMessage) {
      emailBody = `<div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h3>Message from sender:</h3>
        <p>${customMessage}</p>
      </div>${emailBody}`;
    }

    console.log(`Sending email to ${certificate.recipient_name} using ${locationName} template`);

    const emailResponse = await resend.emails.send({
      from: 'certificates@resend.dev',
      to: [certificate.recipient_email],
      subject: subject,
      html: emailBody,
    });

    console.log(`Email sent for ${certificate.recipient_name}:`, emailResponse);

    if (emailResponse.data?.id) {
      // Update certificate email status
      if (supabase) {
        await supabase
          .from('certificates')
          .update({
            email_status: 'SENT',
            last_emailed_at: new Date().toISOString(),
            is_batch_emailed: true
          })
          .eq('id', certificate.id);

        // Create audit log
        await supabase
          .from('certificate_audit_logs')
          .insert({
            certificate_id: certificate.id,
            action: 'EMAILED',
            email_recipient: certificate.recipient_email,
            reason: 'Batch email sent'
          });
      }

      return { success: true, emailId: emailResponse.data.id };
    } else {
      return { success: false, error: emailResponse.error || 'Unknown email error' };
    }
  } catch (error) {
    console.error(`Email error for ${certificate.recipient_name}:`, error);
    return { success: false, error };
  }
}
