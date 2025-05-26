import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maximum number of certificates to process concurrently
const MAX_CONCURRENT = 5;

// Maximum number of retries for failed emails
const MAX_RETRIES = 2;

// Verified sender domain
const VERIFIED_DOMAIN = 'mail.bpiincworks.com';

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
    
    // Process a certificate email with retry logic
    const processCertificateEmail = async (certId: string, templateId?: string) => {
      let retries = 0;
      let lastError;
      
      // Get certificate details first
      const { data: cert, error: certError } = await supabase
        .from('certificates')
        .select(`
          id,
          recipient_name,
          recipient_email,
          certificate_url,
          course_name,
          verification_code,
          issue_date,
          expiry_date,
          status,
          location_id,
          certificate_request_id
        `)
        .eq('id', certId)
        .single();
        
      if (certError) {
        throw new Error(`Failed to fetch certificate ${certId}: ${certError.message}`);
      }
      
      let recipientEmail = cert.recipient_email;
      
      // If no email in certificates table, try to get it from certificate_requests
      if (!recipientEmail && cert.certificate_request_id) {
        const { data: certRequest, error: requestError } = await supabase
          .from('certificate_requests')
          .select('recipient_email')
          .eq('id', cert.certificate_request_id)
          .single();
          
        if (!requestError && certRequest) {
          recipientEmail = certRequest.recipient_email;
        }
      }
      
      if (!recipientEmail) {
        throw new Error(`Certificate ${certId} has no recipient email in either certificates or certificate_requests table`);
      }
      
      // Get complete location details if available
      let locationName = "";
      let locationPhone = "";
      let locationEmail = "";
      let locationWebsite = "";
      
      if (cert.location_id) {
        const { data: location } = await supabase
          .from('locations')
          .select('name, phone, email, website')
          .eq('id', cert.location_id)
          .single();
          
        if (location) {
          locationName = location.name || "";
          locationPhone = location.phone || "";
          locationEmail = location.email || "";
          locationWebsite = location.website || "";
        }
      }
      
      // Get email template
      let emailTemplate;
      if (templateId) {
        const { data: template } = await supabase
          .from('location_email_templates')
          .select('*')
          .eq('id', templateId)
          .single();
          
        if (template) emailTemplate = template;
      } else {
        // Try to find a default template
        const { data: templates } = await supabase
          .from('location_email_templates')
          .select('*')
          .eq('is_default', true)
          .limit(1);
          
        if (templates && templates.length > 0) {
          emailTemplate = templates[0];
        } else {
          // Use a fallback template
          emailTemplate = {
            subject_template: "Your {{course_name}} Certificate",
            body_template: `
              <h1>Hello {{recipient_name}},</h1>
              <p>Your certificate for {{course_name}} is now available.</p>
              {{#if certificate_url}}
              <p><a href="{{certificate_url}}" target="_blank">Click here to view your certificate</a></p>
              {{/if}}
              <p>Certificate details:</p>
              <ul>
                <li>Course: {{course_name}}</li>
                <li>Issue Date: {{issue_date}}</li>
                <li>Expiry Date: {{expiry_date}}</li>
                <li>Verification Code: {{verification_code}}</li>
              </ul>
              {{#if location_name}}
              <p>Issued by: {{location_name}}</p>
              {{/if}}
              {{#if location_phone}}
              <p>Phone: {{location_phone}}</p>
              {{/if}}
              {{#if location_email}}
              <p>Email: {{location_email}}</p>
              {{/if}}
              {{#if location_website}}
              <p>Website: {{location_website}}</p>
              {{/if}}
            `
          };
        }
      }
      
      while (retries <= MAX_RETRIES) {
        try {
          // Enhanced template replacement with all location variables
          let emailHtml = emailTemplate.body_template
            .replace(/{{recipient_name}}/g, cert.recipient_name)
            .replace(/{{course_name}}/g, cert.course_name)
            .replace(/{{certificate_url}}/g, cert.certificate_url || '')
            .replace(/{{issue_date}}/g, cert.issue_date)
            .replace(/{{expiry_date}}/g, cert.expiry_date)
            .replace(/{{verification_code}}/g, cert.verification_code)
            .replace(/{{location_name}}/g, locationName)
            .replace(/{{location_phone}}/g, locationPhone)
            .replace(/{{location_email}}/g, locationEmail)
            .replace(/{{location_website}}/g, locationWebsite);
            
          // Handle conditional blocks for certificate_url
          if (cert.certificate_url) {
            emailHtml = emailHtml.replace(/{{#if certificate_url}}(.*?){{\/if}}/gs, '$1');
          } else {
            emailHtml = emailHtml.replace(/{{#if certificate_url}}(.*?){{\/if}}/gs, '');
          }
          
          // Handle conditional blocks for location fields
          if (locationName) {
            emailHtml = emailHtml.replace(/{{#if location_name}}(.*?){{\/if}}/gs, '$1');
          } else {
            emailHtml = emailHtml.replace(/{{#if location_name}}(.*?){{\/if}}/gs, '');
          }
          
          if (locationPhone) {
            emailHtml = emailHtml.replace(/{{#if location_phone}}(.*?){{\/if}}/gs, '$1');
          } else {
            emailHtml = emailHtml.replace(/{{#if location_phone}}(.*?){{\/if}}/gs, '');
          }
          
          if (locationEmail) {
            emailHtml = emailHtml.replace(/{{#if location_email}}(.*?){{\/if}}/gs, '$1');
          } else {
            emailHtml = emailHtml.replace(/{{#if location_email}}(.*?){{\/if}}/gs, '');
          }
          
          if (locationWebsite) {
            emailHtml = emailHtml.replace(/{{#if location_website}}(.*?){{\/if}}/gs, '$1');
          } else {
            emailHtml = emailHtml.replace(/{{#if location_website}}(.*?){{\/if}}/gs, '');
          }
          
          let emailSubject = emailTemplate.subject_template
            .replace(/{{course_name}}/g, cert.course_name)
            .replace(/{{location_name}}/g, locationName);
          
          // Create verified sender address
          let senderName = locationName || 'BPI Inc Works';
          let senderAddress = `${senderName} <noreply@${VERIFIED_DOMAIN}>`;
          
          console.log(`Sending email for certificate ${certId} from: ${senderAddress}`);
          
          // Send email using Resend API directly
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: senderAddress,
              to: recipientEmail,
              subject: emailSubject,
              html: emailHtml,
            }),
          });
          
          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
          }
          
          const emailResult = await emailResponse.json();
          console.log(`Email sent successfully for certificate ${certId}:`, emailResult);
          
          // Update certificate email status
          await supabase
            .from('certificates')
            .update({
              email_status: 'SENT',
              last_emailed_at: new Date().toISOString(),
              is_batch_emailed: true
            })
            .eq('id', certId);
            
          return emailResult;
        } catch (error) {
          lastError = error;
          console.warn(`Attempt ${retries + 1}/${MAX_RETRIES + 1} failed for certificate ${certId}:`, error);
          retries++;
          
          if (retries <= MAX_RETRIES) {
            // Wait with exponential backoff before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
    };
    
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
              await processCertificateEmail(certId, templateId);
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
    
    // Return immediately with a success message
    return new Response(
      JSON.stringify({
        success: true,
        message: "Batch email process started",
        batchId
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error starting batch email process:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
