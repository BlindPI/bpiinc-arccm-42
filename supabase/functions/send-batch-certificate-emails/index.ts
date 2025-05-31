
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationTemplate {
  id: string;
  subject_template: string;
  body_template: string;
  from_name: string;
  from_email: string;
}

const getLocationEmailTemplate = async (supabase: any, locationId: string): Promise<LocationTemplate | null> => {
  try {
    const { data: template, error } = await supabase
      .from('location_email_templates')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_default', true)
      .single();

    if (error || !template) {
      console.log(`No location template found for location ${locationId}, using fallback`);
      return null;
    }

    return template;
  } catch (error) {
    console.error('Error fetching location template:', error);
    return null;
  }
};

const renderTemplate = (template: string, variables: Record<string, any>): string => {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  }
  
  return rendered;
};

const getDefaultTemplate = () => ({
  subject_template: 'Your {{course_name}} Certificate',
  body_template: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Congratulations {{recipient_name}}!</h2>
      <p>Your certificate for <strong>{{course_name}}</strong> is ready.</p>
      <p><strong>Issue Date:</strong> {{issue_date}}</p>
      <p><strong>Verification Code:</strong> {{verification_code}}</p>
      {{#certificate_url}}
        <p><a href="{{certificate_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Certificate</a></p>
      {{/certificate_url}}
      <p>Keep this email for your records.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This certificate was issued by {{location_name}}<br>
        For verification, use code: {{verification_code}}
      </p>
    </div>
  `,
  from_name: 'First Aid Certification',
  from_email: 'noreply@mail.bpiincworks.com'
});

serve(async (req) => {
  console.log('=== Batch Certificate Email Function Started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any = null;
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    requestBody = await req.json();
    const { certificateIds, batchId, userId } = requestBody;
    
    console.log('Request payload:', { certificateIds: certificateIds?.length, batchId, userId });

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      throw new Error('No certificate IDs provided');
    }

    if (!batchId) {
      throw new Error('No batch ID provided');
    }

    // Update batch status to processing
    console.log('Updating batch status to PROCESSING');
    const { error: batchUpdateError } = await supabase
      .from('email_batch_operations')
      .update({ 
        status: 'PROCESSING',
        processed_certificates: 0,
        successful_emails: 0,
        failed_emails: 0
      })
      .eq('id', batchId);

    if (batchUpdateError) {
      console.error('Error updating batch status:', batchUpdateError);
      throw batchUpdateError;
    }

    // Fetch certificates with location information
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
        certificate_url,
        verification_code,
        location_id,
        locations!inner(
          id,
          name,
          city,
          state
        )
      `)
      .in('id', certificateIds);

    if (fetchError) {
      console.error('Error fetching certificates:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${certificates?.length || 0} certificates`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Process each certificate
    for (const cert of certificates || []) {
      try {
        console.log(`Processing certificate ${cert.id} for ${cert.recipient_name}`);
        
        if (!cert.recipient_email) {
          console.warn(`No email for certificate ${cert.id}, skipping`);
          failedCount++;
          processedCount++;
          continue;
        }

        // Get location-specific email template
        let emailTemplate = null;
        if (cert.location_id) {
          emailTemplate = await getLocationEmailTemplate(supabase, cert.location_id);
        }

        // Use default template if no location template found
        if (!emailTemplate) {
          emailTemplate = getDefaultTemplate();
        }

        // Prepare template variables
        const templateVariables = {
          recipient_name: cert.recipient_name,
          course_name: cert.course_name,
          issue_date: cert.issue_date,
          expiry_date: cert.expiry_date,
          verification_code: cert.verification_code,
          certificate_url: cert.certificate_url,
          location_name: cert.locations?.name || 'Training Center',
          location_city: cert.locations?.city || '',
          location_state: cert.locations?.state || ''
        };

        // Render email content
        const subject = renderTemplate(emailTemplate.subject_template, templateVariables);
        const htmlBody = renderTemplate(emailTemplate.body_template, templateVariables);

        const emailData = {
          from: `${emailTemplate.from_name} <${emailTemplate.from_email}>`,
          to: [cert.recipient_email],
          subject: subject,
          html: htmlBody
        };

        console.log(`Sending email to ${cert.recipient_name} using ${emailTemplate.from_name} template`);

        const emailResult = await resend.emails.send(emailData);
        console.log(`Email sent for ${cert.recipient_name}:`, emailResult);

        if (emailResult.error) {
          console.error(`Email failed for ${cert.recipient_name}:`, emailResult.error);
          failedCount++;
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
            .eq('id', cert.id);
        }

        processedCount++;

        // Update batch progress
        const { error: progressError } = await supabase
          .from('email_batch_operations')
          .update({
            processed_certificates: processedCount,
            successful_emails: successCount,
            failed_emails: failedCount
          })
          .eq('id', batchId);

        if (progressError) {
          console.error('Error updating progress:', progressError);
        } else {
          console.log(`Progress updated: ${processedCount}/${certificateIds.length} (${successCount} success, ${failedCount} failed)`);
        }

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (certError) {
        console.error(`Error processing certificate ${cert.id}:`, certError);
        failedCount++;
        processedCount++;
      }
    }

    // Final batch status update
    console.log('Finalizing batch operation...');
    const finalStatus = failedCount === 0 ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED');
    
    const { error: finalUpdateError } = await supabase
      .from('email_batch_operations')
      .update({
        status: finalStatus,
        processed_certificates: processedCount,
        successful_emails: successCount,
        failed_emails: failedCount,
        completed_at: new Date().toISOString(),
        error_message: failedCount > 0 ? `${failedCount} emails failed to send` : null
      })
      .eq('id', batchId);

    if (finalUpdateError) {
      console.error('Error updating final batch status:', finalUpdateError);
    }

    console.log('=== Batch Email Process Complete ===');
    console.log(`Final stats: ${successCount} success, ${failedCount} failed, ${processedCount} total`);

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        processed: processedCount,
        successful: successCount,
        failed: failedCount,
        status: finalStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('=== Batch Email Function Error ===');
    console.error('Error details:', error);

    // Try to update batch status to failed if we have a batchId
    try {
      if (requestBody?.batchId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        await supabase
          .from('email_batch_operations')
          .update({
            status: 'FAILED',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', requestBody.batchId);
      }
    } catch (updateError) {
      console.error('Error updating batch to failed status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
