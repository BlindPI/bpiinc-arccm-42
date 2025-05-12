
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
      message
    } = await req.json();

    if (!certificateId) {
      throw new Error("Certificate ID is required");
    }

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    console.log(`Sending certificate email for certificateId: ${certificateId} to: ${recipientEmail}`);

    // Fetch certificate details
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      console.error("Error fetching certificate:", certError);
      throw new Error("Certificate not found");
    }

    console.log("Certificate found:", certificate.id);

    // Create email with certificate attachment
    const resend = new Resend(resendApiKey);
    
    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Certificate from Assured Response</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .content { background: #f9f9f9; border-radius: 5px; padding: 20px; margin-bottom: 20px; }
          .button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Your Certificate from Assured Response</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Attached is your certificate for ${certificate.course_name}. You can also access this certificate through your Assured Response account.</p>
          ${message ? `<p>${message}</p>` : ''}
          <p>Certificate details:</p>
          <ul>
            <li><strong>Name:</strong> ${certificate.recipient_name}</li>
            <li><strong>Course:</strong> ${certificate.course_name}</li>
            <li><strong>Issue Date:</strong> ${certificate.issue_date}</li>
            <li><strong>Expiry Date:</strong> ${certificate.expiry_date}</li>
            <li><strong>Verification Code:</strong> ${certificate.verification_code}</li>
          </ul>
          ${certificate.certificate_url ? 
            `<p style="text-align: center; margin: 30px 0;">
              <a href="${certificate.certificate_url}" class="button" target="_blank">Download Certificate</a>
            </p>` : 
            '<p>Your certificate is being processed and will be available soon.</p>'
          }
        </div>
        <div class="footer">
          <p>© 2025 Assured Response Training Center. All rights reserved.</p>
          <p>This email was sent to you because you registered for a course with Assured Response.</p>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'Assured Response <notifications@mail.bpiincworks.com>',
      to: recipientEmail,
      subject: `Your ${certificate.course_name} Certificate`,
      html: emailHtml,
      attachments: certificate.certificate_url ? 
        [{ filename: `${certificate.course_name}_Certificate.pdf`, path: certificate.certificate_url }] : 
        undefined
    });

    if (error) {
      console.error("Error sending certificate email:", error);
      throw error;
    }

    console.log("Certificate email sent successfully:", data);

    // Log the email sending in the audit log
    await supabase
      .from('certificate_audit_logs')
      .insert({
        certificate_id: certificateId,
        action: 'EMAILED',
        reason: `Sent to ${recipientEmail}`
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate email sent successfully"
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
