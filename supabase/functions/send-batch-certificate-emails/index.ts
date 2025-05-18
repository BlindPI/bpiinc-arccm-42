
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@1.0.0";
import Handlebars from "https://esm.sh/handlebars@4.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maximum number of certificates to process concurrently
const MAX_CONCURRENT = 5;

// Maximum number of retries for failed emails
const MAX_RETRIES = 2;

// Add shutdown listener for graceful handling of incomplete batches
addEventListener('beforeunload', async (ev) => {
  console.log('Batch email function shutting down:', ev.detail?.reason);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Find any in-progress batches and mark them as interrupted
      const { data: batches } = await supabase
        .from('email_batch_operations')
        .update({ 
          status: 'FAILED', 
          error_message: 'Function shutdown while processing', 
          completed_at: new Date().toISOString() 
        })
        .eq('status', 'PROCESSING')
        .select();
        
      if (batches && batches.length > 0) {
        console.log(`Marked ${batches.length} in-progress batches as failed due to shutdown`);
      }
    }
  } catch (error) {
    console.error('Error in shutdown handler:', error);
  }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    // Log environment check
    console.log("Environment check:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey,
      hasResendApiKey: !!resendApiKey
    });

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Parse request body
    const { 
      certificateIds,
      batchId,
      templateId,
      userId
    } = await req.json();

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      throw new Error("Invalid certificate IDs");
    }

    if (!batchId) {
      throw new Error("Batch ID is required");
    }

    console.log(`Starting batch email process for ${certificateIds.length} certificates, batch ID: ${batchId}`);
    
    // This is an async background task, so we'll return immediately
    const startProcessing = async () => {
      try {
        // Mark batch as processing
        await supabase
          .from('email_batch_operations')
          .update({ status: 'PROCESSING' })
          .eq('id', batchId);
        
        let successCount = 0;
        let failCount = 0;
        let processedCount = 0;
        
        // Process certificates in chunks to avoid overloading the system
        for (let i = 0; i < certificateIds.length; i += MAX_CONCURRENT) {
          const chunk = certificateIds.slice(i, i + MAX_CONCURRENT);
          
          // Process this chunk in parallel
          await Promise.all(chunk.map(async (certId: string) => {
            try {
              await processCertificateEmail(certId, templateId, supabase, resend);
              successCount++;
            } catch (error) {
              console.error(`Error processing certificate ${certId}:`, error);
              failCount++;
              
              // Log detailed error for troubleshooting
              await supabase
                .from('certificate_audit_logs')
                .insert({
                  certificate_id: certId,
                  action: 'EMAIL_FAILED',
                  reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  performed_by: userId
                });
            } finally {
              processedCount++;
              
              // Update batch operation progress
              await supabase
                .from('email_batch_operations')
                .update({ 
                  processed_certificates: processedCount,
                  successful_emails: successCount,
                  failed_emails: failCount 
                })
                .eq('id', batchId);
            }
          }));
          
          // Short delay between chunks to prevent rate limiting
          if (i + MAX_CONCURRENT < certificateIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Mark batch as completed
        await supabase
          .from('email_batch_operations')
          .update({ 
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          })
          .eq('id', batchId);
        
        console.log(`Batch ${batchId} completed. Success: ${successCount}, Fail: ${failCount}`);
        
        // Also log this batch action
        await supabase
          .from('certificate_audit_logs')
          .insert({
            certificate_id: certificateIds[0],
            action: 'BATCH_EMAIL',
            performed_by: userId,
            reason: `Batch email ${batchId}: ${successCount} successful, ${failCount} failed`
          });
      } catch (error) {
        console.error("Error in batch processing:", error);
        
        // Mark batch as failed
        try {
          await supabase
            .from('email_batch_operations')
            .update({ 
              status: 'FAILED',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              completed_at: new Date().toISOString()
            })
            .eq('id', batchId);
        } catch (updateError) {
          console.error("Failed to update batch status:", updateError);
        }
      }
    };
    
    // Start the processing in the background
    EdgeRuntime.waitUntil(startProcessing());
    
    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Batch email process started",
        batchId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error starting batch email process:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

async function processCertificateEmail(certificateId: string, templateId: string | undefined, supabase: any, resend: any) {
  let retryCount = 0;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} for certificate ${certificateId}`);
      }
      
      console.log(`Processing certificate email for id: ${certificateId}`);
      
      // Fetch certificate details with recipient email and location
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .select(`
          *,
          certificate_requests(email),
          locations:location_id(*)
        `)
        .eq('id', certificateId)
        .single();
  
      if (certError || !certificate) {
        throw new Error(`Certificate not found: ${certError?.message || 'No data returned'}`);
      }
  
      // Get recipient email from certificate request or user
      let recipientEmail = certificate.certificate_requests?.email;
      
      // If no email in certificate request, try to get from user table
      if (!recipientEmail && certificate.user_id) {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', certificate.user_id)
          .single();
          
        if (!userError && user?.email) {
          recipientEmail = user.email;
        }
      }
      
      if (!recipientEmail) {
        throw new Error("No recipient email found for certificate");
      }
  
      // Fetch email template
      let emailTemplate;
      let subjectTemplate = 'Your {{course_name}} Certificate from Assured Response';
      
      if (templateId) {
        const { data: template, error: templateError } = await supabase
          .from('location_email_templates')
          .select('*')
          .eq('id', templateId)
          .single();
          
        if (!templateError && template) {
          emailTemplate = template.body_template;
          subjectTemplate = template.subject_template;
        }
      }
      
      // If template wasn't found by ID and certificate has a location, try to find a default template
      if (!emailTemplate && certificate.location_id) {
        const { data: defaultTemplate, error: defaultTemplateError } = await supabase
          .from('location_email_templates')
          .select('*')
          .eq('location_id', certificate.location_id)
          .eq('is_default', true)
          .maybeSingle();
          
        if (!defaultTemplateError && defaultTemplate) {
          emailTemplate = defaultTemplate.body_template;
          subjectTemplate = defaultTemplate.subject_template;
        }
      }
      
      // If still no template, use fallback
      if (!emailTemplate) {
        emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Certificate of Completion</h2>
          <p>Dear {{recipient_name}},</p>
          <p>Congratulations on successfully completing your {{course_name}} with {{location_name}}! Your official certificate is attached to this email for your records.</p>
          <p>This certification is valid until {{expiry_date}}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
          <p>Regards,</p>
          <p>{{location_name}}<br>
          {{#if location_phone}}Phone: {{location_phone}}<br>{{/if}}
          {{#if location_email}}Email: {{location_email}}<br>{{/if}}
          {{#if location_website}}Website: {{location_website}}{{/if}}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This certificate is issued through {{location_name}} and is issued under Assured Response, WSIB authorized issuer.</p>
        </div>
        `;
      }
  
      // Create template data for variable replacement
      const templateData = {
        recipient_name: certificate.recipient_name,
        course_name: certificate.course_name,
        issue_date: certificate.issue_date,
        expiry_date: certificate.expiry_date,
        verification_code: certificate.verification_code,
        location_name: certificate.locations?.name || 'Assured Response',
        location_email: certificate.locations?.email,
        location_phone: certificate.locations?.phone,
        location_website: certificate.locations?.website,
        location_address: certificate.locations?.address,
        location_city: certificate.locations?.city,
        location_state: certificate.locations?.state,
        location_zip: certificate.locations?.zip
      };
      
      // Compile the templates with Handlebars
      const compiledSubject = Handlebars.compile(subjectTemplate)(templateData);
      const compiledHtml = Handlebars.compile(emailTemplate)(templateData);
      
      // Set the from address - use location email if available
      const fromEmail = certificate.locations?.email || 'notifications@mail.bpiincworks.com';
      const fromName = certificate.locations?.name || 'Assured Response';
      
      // Attempt to get certificate URL for attachment
      let certificateUrl = certificate.certificate_url;
      let hasAttachment = false;

      if (certificateUrl && !certificateUrl.startsWith('http')) {
        // Get the signed URL if it's just a filename
        try {
          const { data: signedUrlData } = await supabase.storage
            .from('certification-pdfs')
            .createSignedUrl(certificateUrl, 60 * 10); // 10 minutes
            
          if (signedUrlData?.signedUrl) {
            certificateUrl = signedUrlData.signedUrl;
            hasAttachment = true;
          }
        } catch (urlError) {
          console.warn(`Could not get signed URL for ${certificateUrl}:`, urlError);
          // Continue without attachment
        }
      } else if (certificateUrl && certificateUrl.startsWith('http')) {
        hasAttachment = true;
      }
      
      if (!hasAttachment) {
        console.warn(`Certificate ${certificateId} does not have a valid attachment URL`);
      }
      
      // Send the email
      const emailParams = {
        from: `${fromName} <${fromEmail}>`,
        to: recipientEmail,
        subject: compiledSubject,
        html: compiledHtml,
        attachments: hasAttachment ? 
          [{ filename: `${certificate.course_name}_Certificate.pdf`, path: certificateUrl }] : 
          undefined
      };
      
      console.log(`Sending email to ${recipientEmail}${hasAttachment ? ' with attachment' : ' without attachment'}`);
      
      const { data: emailData, error: emailError } = await resend.emails.send(emailParams);
  
      if (emailError) {
        throw emailError;
      }
  
      // Update the certificate email status
      await supabase
        .from('certificates')
        .update({
          email_status: 'SENT',
          last_emailed_at: new Date().toISOString()
        })
        .eq('id', certificateId);
  
      // Log the email sending in the audit log
      await supabase
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificateId,
          action: 'EMAILED',
          reason: `Sent to ${recipientEmail} (batch)${hasAttachment ? '' : ' - no attachment'}`,
          email_recipient: recipientEmail,
          email_template_id: templateId
        });
        
      return { success: true };
    } catch (error) {
      console.error(`Error sending email for certificate ${certificateId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      retryCount++;
      
      // If we've reached max retries, update certificate with failed status and throw error
      if (retryCount > MAX_RETRIES) {
        // Update certificate with failed status
        try {
          await supabase
            .from('certificates')
            .update({
              email_status: 'FAILED',
              last_emailed_at: new Date().toISOString()
            })
            .eq('id', certificateId);
        } catch (updateError) {
          console.error(`Failed to update email status for certificate ${certificateId}:`, updateError);
        }
        
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      const delay = 1000 * Math.pow(2, retryCount);
      console.log(`Waiting ${delay}ms before retrying certificate ${certificateId}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Should never reach here due to throw in catch block after max retries
  throw new Error("Unexpected execution path in processCertificateEmail");
}
