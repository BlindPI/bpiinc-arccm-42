import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  subject_line: string;
  target_audience: string;
  target_segments?: Record<string, any>;
  personalization_fields?: Record<string, any>;
  email_template_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_date?: string;
  sent_date?: string;
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  leads_generated?: number;
  opportunities_created?: number;
  revenue_attributed?: number;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_type: 'welcome' | 'nurture' | 'promotional' | 'follow_up' | 'newsletter';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  lead_id: string;
  email: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  personalization_data?: Record<string, any>;
}

export interface CampaignAnalytics {
  campaign_id: string;
  total_sent: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  conversion_rate: number;
  revenue_per_recipient: number;
  engagement_score: number;
}

export class EmailCampaignService {
  // Get all email campaigns
  static async getEmailCampaigns(filters?: {
    status?: string;
    campaign_type?: string;
    created_by?: string;
  }): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(campaign => ({
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        campaign_type: campaign.campaign_type,
        subject_line: campaign.subject_line,
        target_audience: campaign.target_audience,
        target_segments: campaign.target_segments,
        personalization_fields: campaign.personalization_fields,
        email_template_id: campaign.email_template_id,
        status: campaign.status,
        scheduled_date: campaign.scheduled_date,
        sent_date: campaign.sent_date,
        total_recipients: campaign.total_recipients,
        delivered_count: campaign.delivered_count,
        opened_count: campaign.opened_count,
        clicked_count: campaign.clicked_count,
        bounced_count: campaign.bounced_count,
        unsubscribed_count: campaign.unsubscribed_count,
        leads_generated: campaign.leads_generated,
        opportunities_created: campaign.opportunities_created,
        revenue_attributed: campaign.revenue_attributed,
        geographic_targeting: campaign.geographic_targeting,
        industry_targeting: campaign.industry_targeting,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        created_by: campaign.created_by
      }));
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      return [];
    }
  }

  // Create email campaign
  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert({
          campaign_name: campaign.campaign_name,
          campaign_type: campaign.campaign_type,
          subject_line: campaign.subject_line,
          target_audience: campaign.target_audience,
          target_segments: campaign.target_segments,
          personalization_fields: campaign.personalization_fields,
          email_template_id: campaign.email_template_id,
          status: campaign.status,
          scheduled_date: campaign.scheduled_date,
          geographic_targeting: campaign.geographic_targeting,
          industry_targeting: campaign.industry_targeting,
          created_by: campaign.created_by
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        campaign_name: data.campaign_name,
        campaign_type: data.campaign_type,
        subject_line: data.subject_line,
        target_audience: data.target_audience,
        target_segments: data.target_segments,
        personalization_fields: data.personalization_fields,
        email_template_id: data.email_template_id,
        status: data.status,
        scheduled_date: data.scheduled_date,
        sent_date: data.sent_date,
        total_recipients: data.total_recipients,
        delivered_count: data.delivered_count,
        opened_count: data.opened_count,
        clicked_count: data.clicked_count,
        bounced_count: data.bounced_count,
        unsubscribed_count: data.unsubscribed_count,
        leads_generated: data.leads_generated,
        opportunities_created: data.opportunities_created,
        revenue_attributed: data.revenue_attributed,
        geographic_targeting: data.geographic_targeting,
        industry_targeting: data.industry_targeting,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error creating email campaign:', error);
      return null;
    }
  }

  // Update email campaign
  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .update({
          ...(updates.campaign_name && { campaign_name: updates.campaign_name }),
          ...(updates.campaign_type && { campaign_type: updates.campaign_type }),
          ...(updates.subject_line && { subject_line: updates.subject_line }),
          ...(updates.target_audience && { target_audience: updates.target_audience }),
          ...(updates.target_segments && { target_segments: updates.target_segments }),
          ...(updates.personalization_fields && { personalization_fields: updates.personalization_fields }),
          ...(updates.email_template_id && { email_template_id: updates.email_template_id }),
          ...(updates.status && { status: updates.status }),
          ...(updates.scheduled_date && { scheduled_date: updates.scheduled_date }),
          ...(updates.sent_date && { sent_date: updates.sent_date }),
          ...(updates.total_recipients !== undefined && { total_recipients: updates.total_recipients }),
          ...(updates.delivered_count !== undefined && { delivered_count: updates.delivered_count }),
          ...(updates.opened_count !== undefined && { opened_count: updates.opened_count }),
          ...(updates.clicked_count !== undefined && { clicked_count: updates.clicked_count }),
          ...(updates.bounced_count !== undefined && { bounced_count: updates.bounced_count }),
          ...(updates.unsubscribed_count !== undefined && { unsubscribed_count: updates.unsubscribed_count }),
          ...(updates.leads_generated !== undefined && { leads_generated: updates.leads_generated }),
          ...(updates.opportunities_created !== undefined && { opportunities_created: updates.opportunities_created }),
          ...(updates.revenue_attributed !== undefined && { revenue_attributed: updates.revenue_attributed }),
          ...(updates.geographic_targeting && { geographic_targeting: updates.geographic_targeting }),
          ...(updates.industry_targeting && { industry_targeting: updates.industry_targeting }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        campaign_name: data.campaign_name,
        campaign_type: data.campaign_type,
        subject_line: data.subject_line,
        target_audience: data.target_audience,
        target_segments: data.target_segments,
        personalization_fields: data.personalization_fields,
        email_template_id: data.email_template_id,
        status: data.status,
        scheduled_date: data.scheduled_date,
        sent_date: data.sent_date,
        total_recipients: data.total_recipients,
        delivered_count: data.delivered_count,
        opened_count: data.opened_count,
        clicked_count: data.clicked_count,
        bounced_count: data.bounced_count,
        unsubscribed_count: data.unsubscribed_count,
        leads_generated: data.leads_generated,
        opportunities_created: data.opportunities_created,
        revenue_attributed: data.revenue_attributed,
        geographic_targeting: data.geographic_targeting,
        industry_targeting: data.industry_targeting,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error updating email campaign:', error);
      return null;
    }
  }

  // Delete email campaign
  static async deleteEmailCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting email campaign:', error);
      return false;
    }
  }

  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    try {
      const { data: campaign, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const totalSent = campaign.total_recipients || 0;
      const delivered = campaign.delivered_count || 0;
      const opened = campaign.opened_count || 0;
      const clicked = campaign.clicked_count || 0;
      const bounced = campaign.bounced_count || 0;
      const unsubscribed = campaign.unsubscribed_count || 0;
      const leadsGenerated = campaign.leads_generated || 0;
      const revenue = campaign.revenue_attributed || 0;

      return {
        campaign_id: campaignId,
        total_sent: totalSent,
        delivery_rate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
        click_rate: opened > 0 ? (clicked / opened) * 100 : 0,
        bounce_rate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        unsubscribe_rate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
        conversion_rate: totalSent > 0 ? (leadsGenerated / totalSent) * 100 : 0,
        revenue_per_recipient: totalSent > 0 ? revenue / totalSent : 0,
        engagement_score: this.calculateEngagementScore(opened, clicked, delivered)
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      return null;
    }
  }

  // Calculate engagement score
  private static calculateEngagementScore(opened: number, clicked: number, delivered: number): number {
    if (delivered === 0) return 0;
    
    const openWeight = 0.3;
    const clickWeight = 0.7;
    
    const openScore = (opened / delivered) * openWeight;
    const clickScore = (clicked / delivered) * clickWeight;
    
    return Math.round((openScore + clickScore) * 100);
  }

  // Get campaign performance summary
  static async getCampaignPerformanceSummary() {
    try {
      const { data: campaigns, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('status', 'sent');

      if (error) throw error;

      const summary = {
        total_campaigns: campaigns?.length || 0,
        total_recipients: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_revenue: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        avg_conversion_rate: 0
      };

      if (!campaigns || campaigns.length === 0) {
        return summary;
      }

      campaigns.forEach(campaign => {
        summary.total_recipients += campaign.total_recipients || 0;
        summary.total_delivered += campaign.delivered_count || 0;
        summary.total_opened += campaign.opened_count || 0;
        summary.total_clicked += campaign.clicked_count || 0;
        summary.total_revenue += campaign.revenue_attributed || 0;
      });

      // Calculate averages
      const campaignAnalytics = campaigns.map(campaign => {
        const delivered = campaign.delivered_count || 0;
        const opened = campaign.opened_count || 0;
        const clicked = campaign.clicked_count || 0;
        const totalSent = campaign.total_recipients || 0;
        const leads = campaign.leads_generated || 0;

        return {
          open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
          click_rate: opened > 0 ? (clicked / opened) * 100 : 0,
          conversion_rate: totalSent > 0 ? (leads / totalSent) * 100 : 0
        };
      });

      summary.avg_open_rate = campaignAnalytics.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length;
      summary.avg_click_rate = campaignAnalytics.reduce((sum, c) => sum + c.click_rate, 0) / campaigns.length;
      summary.avg_conversion_rate = campaignAnalytics.reduce((sum, c) => sum + c.conversion_rate, 0) / campaigns.length;

      return summary;
    } catch (error) {
      console.error('Error getting campaign performance summary:', error);
      return {
        total_campaigns: 0,
        total_recipients: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_revenue: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        avg_conversion_rate: 0
      };
    }
  }

  // Get target audience for campaign
  static async getTargetAudience(criteria: {
    lead_source?: string[];
    industry?: string[];
    company_size?: string[];
    lead_score_min?: number;
    geographic_location?: string[];
    lead_status?: string[];
  }): Promise<{ count: number; leads: any[] }> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*');

      if (criteria.lead_source && criteria.lead_source.length > 0) {
        query = query.in('lead_source', criteria.lead_source);
      }
      if (criteria.industry && criteria.industry.length > 0) {
        query = query.in('industry', criteria.industry);
      }
      if (criteria.company_size && criteria.company_size.length > 0) {
        query = query.in('company_size', criteria.company_size);
      }
      if (criteria.lead_score_min) {
        query = query.gte('lead_score', criteria.lead_score_min);
      }
      if (criteria.geographic_location && criteria.geographic_location.length > 0) {
        query = query.in('province', criteria.geographic_location);
      }
      if (criteria.lead_status && criteria.lead_status.length > 0) {
        query = query.in('lead_status', criteria.lead_status);
      }

      // Only include leads with valid email addresses
      query = query.not('email', 'is', null);

      const { data, error } = await query;
      if (error) throw error;

      return {
        count: data?.length || 0,
        leads: data || []
      };
    } catch (error) {
      console.error('Error getting target audience:', error);
      return { count: 0, leads: [] };
    }
  }

  // Send campaign (placeholder - would integrate with email service)
  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Get the campaign details
      // 2. Get the target audience
      // 3. Generate personalized emails
      // 4. Send via email service (SendGrid, Mailgun, etc.)
      // 5. Update campaign status and metrics

      // For now, just update the status
      await this.updateEmailCampaign(campaignId, {
        status: 'sent',
        sent_date: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  }

  // Get default email templates
  static getDefaultEmailTemplates(): Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] {
    return [
      {
        name: 'Welcome New Lead',
        subject: 'Welcome to {{company_name}} - Your Safety Training Partner',
        html_content: `
          <h1>Welcome {{first_name}}!</h1>
          <p>Thank you for your interest in our safety training programs.</p>
          <p>We understand that {{company_name}} is looking for quality training solutions, and we're here to help.</p>
          <p>Our team will be in touch soon to discuss your specific needs.</p>
          <p>Best regards,<br>The Training Team</p>
        `,
        text_content: 'Welcome {{first_name}}! Thank you for your interest in our safety training programs...',
        template_type: 'welcome',
        variables: ['first_name', 'company_name'],
        is_active: true
      },
      {
        name: 'Follow-up After Initial Contact',
        subject: 'Following up on your training needs - {{company_name}}',
        html_content: `
          <h1>Hi {{first_name}},</h1>
          <p>I wanted to follow up on our recent conversation about safety training for {{company_name}}.</p>
          <p>Based on your needs for {{estimated_participant_count}} participants, I've prepared some options that might interest you.</p>
          <p>Would you be available for a brief call this week to discuss?</p>
          <p>Best regards,<br>{{sales_rep_name}}</p>
        `,
        template_type: 'follow_up',
        variables: ['first_name', 'company_name', 'estimated_participant_count', 'sales_rep_name'],
        is_active: true
      },
      {
        name: 'Training Program Promotion',
        subject: 'New {{course_type}} Training Programs Available',
        html_content: `
          <h1>New Training Opportunities for {{company_name}}</h1>
          <p>Hi {{first_name}},</p>
          <p>We're excited to announce new {{course_type}} training programs that would be perfect for your team.</p>
          <ul>
            <li>Flexible scheduling options</li>
            <li>On-site or virtual delivery</li>
            <li>Certified instructors</li>
            <li>Competitive pricing</li>
          </ul>
          <p>Contact us today to learn more!</p>
        `,
        template_type: 'promotional',
        variables: ['first_name', 'company_name', 'course_type'],
        is_active: true
      }
    ];
  }
}