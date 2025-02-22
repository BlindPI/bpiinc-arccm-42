
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED';
  recipientEmail: string;
  recipientName: string;
  courseName?: string;
  rejectionReason?: string;
}

const getEmailContent = (params: NotificationRequest) => {
  switch (params.type) {
    case 'CERTIFICATE_REQUEST':
      return {
        subject: 'New Certificate Request Submitted',
        html: `
          <h1>New Certificate Request</h1>
          <p>Hello ${params.recipientName},</p>
          <p>Your certificate request for ${params.courseName} has been successfully submitted.</p>
          <p>We will review your request and notify you once it has been processed.</p>
          <p>Best regards,<br>Certification Team</p>
        `
      };
    case 'CERTIFICATE_APPROVED':
      return {
        subject: 'Certificate Request Approved',
        html: `
          <h1>Certificate Request Approved</h1>
          <p>Hello ${params.recipientName},</p>
          <p>Great news! Your certificate request for ${params.courseName} has been approved.</p>
          <p>You can now access and download your certificate from your dashboard.</p>
          <p>Best regards,<br>Certification Team</p>
        `
      };
    case 'CERTIFICATE_REJECTED':
      return {
        subject: 'Certificate Request Update',
        html: `
          <h1>Certificate Request Status Update</h1>
          <p>Hello ${params.recipientName},</p>
          <p>Your certificate request for ${params.courseName} requires additional review.</p>
          <p>Reason: ${params.rejectionReason}</p>
          <p>Please review the feedback and submit a new request if needed.</p>
          <p>Best regards,<br>Certification Team</p>
        `
      };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notificationData: NotificationRequest = await req.json();
    console.log('Processing notification request:', notificationData);

    const emailContent = getEmailContent(notificationData);
    
    const emailResponse = await resend.emails.send({
      from: 'Certification System <notifications@resend.dev>',
      to: [notificationData.recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
