
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const getNotificationTemplate = (type: string, data: any) => {
  switch (type) {
    case 'DOCUMENT_EXPIRING':
      return {
        subject: 'Document Expiring Soon',
        html: `
          <h2>Document Expiring Soon</h2>
          <p>Your ${data.document_type} will expire on ${new Date(data.expiry_date).toLocaleDateString()}.</p>
          <p>Please update your document before it expires to maintain compliance.</p>
        `
      };
    case 'COMPLIANCE_WARNING':
      return {
        subject: 'Compliance Status Warning',
        html: `
          <h2>Compliance Warning</h2>
          <p>${data.message}</p>
          <p>Please address this compliance issue as soon as possible.</p>
        `
      };
    case 'DOCUMENT_APPROVED':
      return {
        subject: 'Document Approved',
        html: `
          <h2>Document Approved</h2>
          <p>Your document submission has been approved.</p>
        `
      };
    case 'DOCUMENT_REJECTED':
      return {
        subject: 'Document Needs Revision',
        html: `
          <h2>Document Needs Revision</h2>
          <p>Your document submission requires revision.</p>
          <p>Please check the feedback and submit an updated version.</p>
        `
      };
    default:
      return {
        subject: 'Notification',
        html: `
          <h2>${data.title}</h2>
          <p>${data.message}</p>
        `
      };
  }
};

const processNotification = async (notification: any, recipientEmail: string) => {
  try {
    const template = getNotificationTemplate(notification.type, notification.metadata);
    
    const emailResponse = await resend.emails.send({
      from: "Certificate Management System <notifications@yourdomain.com>",
      to: [recipientEmail],
      subject: template.subject,
      html: template.html,
    });

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    // Update notification status in the queue
    await supabaseClient
      .from('notification_queue')
      .update({ 
        status: 'SENT',
        processed_at: new Date().toISOString(),
        error: null 
      })
      .eq('notification_id', notification.id);

    return emailResponse;
  } catch (error) {
    console.error('Error processing notification:', error);
    
    // Update notification status with error
    await supabaseClient
      .from('notification_queue')
      .update({ 
        status: 'FAILED',
        processed_at: new Date().toISOString(),
        error: error.message 
      })
      .eq('notification_id', notification.id);

    throw error;
  }
};

const handler = async (_req: Request): Promise<Response> => {
  try {
    // Handle CORS
    if (_req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Get pending notifications from the queue
    const { data: queueItems, error: queueError } = await supabaseClient
      .from('notification_queue')
      .select(`
        *,
        notifications:notification_id (
          *,
          recipient:recipient_id (
            email
          )
        )
      `)
      .eq('status', 'PENDING')
      .limit(10);

    if (queueError) throw queueError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.allSettled(
      queueItems.map(item => 
        processNotification(
          item.notifications,
          item.notifications.recipient.email
        )
      )
    );

    const summary = results.reduce(
      (acc, result) => {
        if (result.status === 'fulfilled') acc.success++;
        else acc.failed++;
        return acc;
      },
      { success: 0, failed: 0 }
    );

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} notifications`,
        summary
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Error in process-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
};

serve(handler);
