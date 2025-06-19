
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const {
      certificateId,
      recipientEmail,
      message,
      templateId,
      allowEmailOverride = false
    } = await req.json();

    if (!certificateId) {
      throw new Error("Certificate ID is required");
    }

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    console.log(`Processing certificate email for certificateId: ${certificateId} to: ${recipientEmail}`);

    // Fetch certificate details with location
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select(`
        *,
        locations:location_id(*)
      `)
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      console.error("Error fetching certificate:", certError);
      throw new Error("Certificate not found");
    }

    console.log("Certificate found:", certificate.id);

    // SECURITY: Validate email recipient matches certificate or is explicitly allowed
    const storedEmail = certificate.recipient_email;
    const isEmailOverride = recipientEmail !== storedEmail;
    
    if (isEmailOverride) {
      console.log(`Email override detected: stored=${storedEmail}, requested=${recipientEmail}`);
      
      // If email override is not explicitly allowed, reject the request
      if (!allowEmailOverride) {
        throw new Error(`Email override not allowed. Certificate is registered to ${storedEmail || 'no email'}, but email requested for ${recipientEmail}`);
      }
      
      // Log the override for audit purposes
      console.log(`AUDIT: Email override approved for certificate ${certificateId}: ${storedEmail} -> ${recipientEmail}`);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error(`Invalid email format: ${recipientEmail}`);
    }

    // Fetch email template
    let emailTemplate;
    let subjectTemplate = 'Your {{course_name}} Certificate from {{location_name}}';
    
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (!templateError && template) {
        emailTemplate = template.body_template;
        subjectTemplate = template.subject_template;
        console.log("Using template:", template.name);
      } else {
        console.log("Template not found, looking for location default template");
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
        console.log("Using default location template:", defaultTemplate.name);
      } else {
        console.log("No default template for location found, using system default");
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
        <p style="font-size: 12px; color: #666;">This certificate is issued through {{location_name}} and is issued under Assured Response, WSIB authorized issuer.</p>
        {{#if custom_message}}<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007cba;"><strong>Additional Message:</strong><br>{{custom_message}}</div>{{/if}}
      </div>
      `;
      console.log("Using fallback template");
    }

    // Create template data for variable replacement
    const templateData = {
      recipient_name: certificate.recipient_name,
      course_name: certificate.course_name,
      issue_date: certificate.issue_date,
      expiry_date: certificate.expiry_date,
      verification_code: certificate.verification_code,
      location_name: certificate.locations?.name || 'Assured Response',
      location_email: certificate.locations?.email || '',
      location_phone: certificate.locations?.phone || '',
      location_website: certificate.locations?.website || '',
      location_address: certificate.locations?.address || '',
      location_city: certificate.locations?.city || '',
      location_state: certificate.locations?.state || '',
      location_zip: certificate.locations?.zip || '',
      custom_message: message || ''
    };
    
    // Simple template variable replacement
    const processTemplate = (template: string, data: any) => {
      let result = template;
      
      // Replace simple variables like {{variable_name}}
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, data[key] || '');
      });
      
      // Handle conditional blocks like {{#if variable}}...{{/if}}
      result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
        return data[variable] ? content : '';
      });
      
      return result;
    };
    
    const compiledSubject = processTemplate(subjectTemplate, templateData);
    const compiledHtml = processTemplate(emailTemplate, templateData);
    
    // Set the from address - ALWAYS use verified domain
    const senderName = certificate.locations?.name || 'Assured Response';
    const fromEmail = `${senderName} <notifications@${VERIFIED_DOMAIN}>`;
    
    // Prepare email data
    const emailData = {
      from: fromEmail,
      to: [recipientEmail],
      subject: compiledSubject,
      html: compiledHtml,
      attachments: certificate.certificate_url ? [
        {
          filename: `${certificate.course_name}_Certificate.pdf`,
          path: certificate.certificate_url
        }
      ] : []
    };

    console.log('Sending email with data:', { 
      from: emailData.from, 
      to: emailData.to, 
      subject: emailData.subject,
      hasAttachment: !!certificate.certificate_url
    });

    // Send email using fetch instead of Resend client
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Email send failed: ${emailResponse.status} ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Certificate email sent successfully:", emailResult);

    // Update the certificate email status
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        email_status: 'SENT',
        last_emailed_at: new Date().toISOString()
      })
      .eq('id', certificateId);

    if (updateError) {
      console.error('Error updating certificate status:', updateError);
      // Don't throw here as email was sent successfully
    }

    // Log the email sending in the audit log with detailed information
    const auditReason = isEmailOverride
      ? `Email override: sent to ${recipientEmail} (original: ${storedEmail || 'none'})`
      : `Sent to ${recipientEmail}`;
      
    const { error: logError } = await supabase
      .from('certificate_audit_logs')
      .insert({
        certificate_id: certificateId,
        action: 'EMAILED',
        reason: auditReason,
        email_recipient: recipientEmail,
        email_template_id: templateId
      });

    if (logError) {
      console.error('Error logging email action:', logError);
      // Don't throw here as email was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate email sent successfully",
        emailId: emailResult.id
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing certificate email:", error);
    
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
