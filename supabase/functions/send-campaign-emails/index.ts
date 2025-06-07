
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaignId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const { campaignId }: SendCampaignRequest = await req.json();

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('crm_email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get target audience based on campaign criteria
    let query = supabase.from('crm_leads').select('email, first_name, last_name');
    
    // Apply geographic targeting if specified
    if (campaign.geographic_targeting && campaign.geographic_targeting.length > 0) {
      // This would need to be implemented based on your geographic data structure
    }

    // Apply industry targeting if specified
    if (campaign.industry_targeting && campaign.industry_targeting.length > 0) {
      query = query.in('industry', campaign.industry_targeting);
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      throw new Error('Failed to fetch recipients');
    }

    let sentCount = 0;
    let deliveredCount = 0;
    let bouncedCount = 0;

    // Send emails to each recipient
    for (const recipient of recipients || []) {
      if (!recipient.email) continue;

      try {
        const emailResponse = await resend.emails.send({
          from: "Training Company <noreply@trainingcompany.com>",
          to: [recipient.email],
          subject: campaign.subject_line,
          html: `
            <h1>Hello ${recipient.first_name || 'there'}!</h1>
            <p>This is a campaign email from ${campaign.campaign_name}.</p>
            <p>Campaign Type: ${campaign.campaign_type}</p>
            <p>Target Audience: ${campaign.target_audience || 'General'}</p>
            <hr>
            <p><small>This email was sent as part of our ${campaign.campaign_type} campaign.</small></p>
            <p><small><a href="mailto:unsubscribe@trainingcompany.com">Unsubscribe</a></small></p>
          `,
        });

        if (emailResponse.error) {
          bouncedCount++;
          console.error(`Failed to send to ${recipient.email}:`, emailResponse.error);
        } else {
          deliveredCount++;
        }
        sentCount++;
      } catch (error) {
        bouncedCount++;
        console.error(`Error sending to ${recipient.email}:`, error);
      }
    }

    // Update campaign with sending results
    await supabase
      .from('crm_email_campaigns')
      .update({
        total_recipients: sentCount,
        delivered_count: deliveredCount,
        bounced_count: bouncedCount,
        status: 'sent',
        sent_date: new Date().toISOString()
      })
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign sent successfully`,
        stats: {
          totalRecipients: sentCount,
          delivered: deliveredCount,
          bounced: bouncedCount
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-campaign-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
