
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Verified sender domain
const VERIFIED_DOMAIN = 'mail.bpiincworks.com';

serve(async (req) => {
  console.log("=== Batch Certificate Email Function Started ===");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasResendKey: !!resendApiKey
    });

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { certificateIds, batchId, userId, customMessage } = await req.json();

    console.log("Request payload:", {
      certificateIds: certificateIds?.length,
      batchId,
      userId
    });

    if (!certificateIds || certificateIds.length === 0) {
      throw new Error("Certificate IDs are required");
    }

    // Update batch status to PROCESSING
    console.log("Updating batch status to PROCESSING");
    await supabase
      .from('email_batch_operations')
      .update({ status: 'PROCESSING' })
      .eq('id', batchId);

    // Fetch certificates with their data - NO LOCATION JOIN
    console.log("Fetching certificates with location data...");
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .in('id', certificateIds);

    if (certError) {
      console.error("Error fetching certificates:", certError);
      throw new Error("Failed to fetch certificates");
    }

    console.log(`Found ${certificates?.length || 0} certificates`);

    let successCount = 0;
    let failureCount = 0;
    const totalCertificates = certificates?.length || 0;

    // Process each certificate
    for (let i = 0; i < totalCertificates; i++) {
      const certificate = certificates[i];
      console.log(`Processing certificate ${certificate.id} for ${certificate.recipient_name}`);

      try {
        // Get location details separately if needed
        let locationData = null;
        if (certificate.location_id) {
          const { data: location } = await supabase
            .from('locations')
            .select('*')
            .eq('id', certificate.location_id)
            .single();
          locationData = location;
        }

        // Get email template for this location
        let emailTemplate = null;
        let subjectTemplate = 'Your {{course_name}} Certificate from {{location_name}}';
        
        if (certificate.location_id) {
          const { data: template } = await supabase
            .from('location_email_templates')
            .select('*')
            .eq('location_id', certificate.location_id)
            .eq('is_default', true)
            .maybeSingle();
            
          if (template) {
            emailTemplate = template.body_template;
            subjectTemplate = template.subject_template;
            console.log(`Sending email to ${certificate.recipient_name} using ${template.name} template`);
          } else {
            console.log(`Sending email to ${certificate.recipient_name} using fallback template`);
          }
        } else {
          console.log(`Sending email to ${certificate.recipient_name} using fallback template`);
        }

        // Use fallback template if none found
        if (!emailTemplate) {
          emailTemplate = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Certificate of Completion</h2>
            <p>Dear {{recipient_name}},</p>
            <p>Congratulations on successfully completing your {{course_name}} with {{location_name}}! Your official certificate is available:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="{{certificate_url}}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Your Certificate</a>
            </p>
            <p>This certification is valid until {{expiry_date}}. We recommend saving a digital copy and printing one for your workplace or school requirements.</p>
            <p>Need additional training for yourself or your team? We offer regular courses in:</p>
            <ul>
              <li>Standard First Aid & CPR</li>
              <li>Emergency First Aid</li>
              <li>CPR/AED (Levels A, C, and BLS)</li>
              <li>Specialized workplace training</li>
            </ul>
            <p>Contact us for more information or to schedule training.</p>
            <p>Regards,</p>
            <p>{{location_name}}<br>
            {{#if location_phone}}Phone: {{location_phone}}<br>{{/if}}
            {{#if location_email}}Email: {{location_email}}<br>{{/if}}
            {{#if location_website}}Website: {{location_website}}{{/if}}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">This certificate is issued through {{location_name}} and is issued under Assured Response, WSIB authorized issuer, www.assuredresponse.com.</p>
            {{#if custom_message}}<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007cba;"><strong>Additional Message:</strong><br>{{custom_message}}</div>{{/if}}
          </div>
          `;
        }

        // Create template data
        const templateData = {
          recipient_name: certificate.recipient_name,
          course_name: certificate.course_name,
          issue_date: certificate.issue_date,
          expiry_date: certificate.expiry_date,
          verification_code: certificate.verification_code,
          certificate_url: certificate.certificate_url,
          location_name: locationData?.name || 'Assured Response',
          location_email: locationData?.email || '',
          location_phone: locationData?.phone || '',
          location_website: locationData?.website || '',
          custom_message: customMessage || ''
        };

        // Simple template variable replacement
        const processTemplate = (template: string, data: any) => {
          let result = template;
          
          // Replace simple variables
          Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, data[key] || '');
          });
          
          // Handle conditional blocks
          result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
            return data[variable] ? content : '';
          });
          
          return result;
        };

        const compiledSubject = processTemplate(subjectTemplate, templateData);
        const compiledHtml = processTemplate(emailTemplate, templateData);

        // FIXED: Ensure proper from email format
        const senderName = locationData?.name || 'Assured Response';
        const fromEmail = `${senderName} <notifications@${VERIFIED_DOMAIN}>`;

        // Skip if no recipient email
        if (!certificate.recipient_email) {
          console.log(`Skipping ${certificate.recipient_name} - no email address`);
          failureCount++;
          continue;
        }

        // Send email using Resend API
        const emailData = {
          from: fromEmail,
          to: [certificate.recipient_email],
          subject: compiledSubject,
          html: compiledHtml,
          attachments: certificate.certificate_url ? [
            {
              filename: `${certificate.course_name}_Certificate.pdf`,
              path: certificate.certificate_url
            }
          ] : []
        };

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        const emailResult = await emailResponse.json();
        console.log(`Email sent for ${certificate.recipient_name}:`, { data: emailResult, error: emailResponse.ok ? null : emailResult });

        if (!emailResponse.ok) {
          console.error(`Email failed for ${certificate.recipient_name}:`, emailResult);
          failureCount++;
        } else {
          successCount++;
          // Update certificate email status
          await supabase
            .from('certificates')
            .update({
              email_status: 'SENT',
              last_emailed_at: new Date().toISOString(),
              is_batch_emailed: true,
              batch_email_id: batchId
            })
            .eq('id', certificate.id);
        }
      } catch (error) {
        console.error(`Error processing certificate ${certificate.id}:`, error);
        failureCount++;
      }

      // Update progress
      const processed = i + 1;
      console.log(`Progress updated: ${processed}/${totalCertificates} (${successCount} success, ${failureCount} failed)`);
      
      await supabase
        .from('email_batch_operations')
        .update({
          processed_certificates: processed,
          successful_emails: successCount,
          failed_emails: failureCount
        })
        .eq('id', batchId);
    }

    // Finalize batch operation
    console.log("Finalizing batch operation...");
    await supabase
      .from('email_batch_operations')
      .update({
        status: failureCount === totalCertificates ? 'FAILED' : 'COMPLETED',
        completed_at: new Date().toISOString(),
        error_message: failureCount > 0 ? `${failureCount} emails failed to send` : null
      })
      .eq('id', batchId);

    console.log("=== Batch Email Process Complete ===");
    console.log(`Final stats: ${successCount} success, ${failureCount} failed, ${totalCertificates} total`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalCertificates,
        successful: successCount,
        failed: failureCount
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in batch email function:", error);
    
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
