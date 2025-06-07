
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

export interface CampaignPerformanceSummary {
  total_campaigns: number;
  total_recipients: number;
  avg_open_rate: number;
  avg_click_rate: number;
  total_revenue: number;
}

export interface CampaignAnalytics {
  campaign_id: string;
  opens_over_time: Array<{ date: string; opens: number }>;
  clicks_over_time: Array<{ date: string; clicks: number }>;
  geographic_breakdown: Array<{ location: string; opens: number; clicks: number }>;
  device_breakdown: Array<{ device: string; opens: number; clicks: number }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  variables: string[];
  is_active: boolean;
}

export interface TargetAudience {
  id: string;
  name: string;
  criteria: Record<string, any>;
  estimated_size: number;
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
        target_segments: campaign.target_segments as Record<string, any> || {},
        personalization_fields: campaign.personalization_fields as Record<string, any> || {},
        email_template_id: campaign.email_template_id,
        status: campaign.status as EmailCampaign['status'],
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
        target_segments: data.target_segments as Record<string, any> || {},
        personalization_fields: data.personalization_fields as Record<string, any> || {},
        email_template_id: data.email_template_id,
        status: data.status as EmailCampaign['status'],
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
      const updateData: any = {};
      
      if (updates.campaign_name) updateData.campaign_name = updates.campaign_name;
      if (updates.campaign_type) updateData.campaign_type = updates.campaign_type;
      if (updates.subject_line) updateData.subject_line = updates.subject_line;
      if (updates.target_audience) updateData.target_audience = updates.target_audience;
      if (updates.target_segments) updateData.target_segments = updates.target_segments;
      if (updates.personalization_fields) updateData.personalization_fields = updates.personalization_fields;
      if (updates.email_template_id) updateData.email_template_id = updates.email_template_id;
      if (updates.status) updateData.status = updates.status;
      if (updates.scheduled_date) updateData.scheduled_date = updates.scheduled_date;
      if (updates.sent_date) updateData.sent_date = updates.sent_date;
      if (updates.total_recipients !== undefined) updateData.total_recipients = updates.total_recipients;
      if (updates.delivered_count !== undefined) updateData.delivered_count = updates.delivered_count;
      if (updates.opened_count !== undefined) updateData.opened_count = updates.opened_count;
      if (updates.clicked_count !== undefined) updateData.clicked_count = updates.clicked_count;
      if (updates.bounced_count !== undefined) updateData.bounced_count = updates.bounced_count;
      if (updates.unsubscribed_count !== undefined) updateData.unsubscribed_count = updates.unsubscribed_count;
      if (updates.leads_generated !== undefined) updateData.leads_generated = updates.leads_generated;
      if (updates.opportunities_created !== undefined) updateData.opportunities_created = updates.opportunities_created;
      if (updates.revenue_attributed !== undefined) updateData.revenue_attributed = updates.revenue_attributed;
      if (updates.geographic_targeting) updateData.geographic_targeting = updates.geographic_targeting;
      if (updates.industry_targeting) updateData.industry_targeting = updates.industry_targeting;

      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .update(updateData)
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
        target_segments: data.target_segments as Record<string, any> || {},
        personalization_fields: data.personalization_fields as Record<string, any> || {},
        email_template_id: data.email_template_id,
        status: data.status as EmailCampaign['status'],
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

  // Send campaign
  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .update({ 
          status: 'sending',
          sent_date: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  }

  // Get campaign performance summary
  static async getCampaignPerformanceSummary(): Promise<CampaignPerformanceSummary> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*');

      if (error) throw error;

      const campaigns = data || [];
      const totalCampaigns = campaigns.length;
      const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
      const totalOpens = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);

      return {
        total_campaigns: totalCampaigns,
        total_recipients: totalRecipients,
        avg_open_rate: totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0,
        avg_click_rate: totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0,
        total_revenue: totalRevenue
      };
    } catch (error) {
      console.error('Error fetching campaign performance summary:', error);
      return {
        total_campaigns: 0,
        total_recipients: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        total_revenue: 0
      };
    }
  }

  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      // Mock data for now - in a real implementation this would come from analytics tables
      return {
        campaign_id: campaignId,
        opens_over_time: [
          { date: '2024-01-01', opens: 45 },
          { date: '2024-01-02', opens: 67 },
          { date: '2024-01-03', opens: 23 }
        ],
        clicks_over_time: [
          { date: '2024-01-01', clicks: 12 },
          { date: '2024-01-02', clicks: 18 },
          { date: '2024-01-03', clicks: 8 }
        ],
        geographic_breakdown: [
          { location: 'Toronto', opens: 45, clicks: 12 },
          { location: 'Vancouver', opens: 32, clicks: 8 }
        ],
        device_breakdown: [
          { device: 'Desktop', opens: 67, clicks: 15 },
          { device: 'Mobile', opens: 45, clicks: 10 }
        ]
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return {
        campaign_id: campaignId,
        opens_over_time: [],
        clicks_over_time: [],
        geographic_breakdown: [],
        device_breakdown: []
      };
    }
  }

  // Get target audiences
  static async getTargetAudience(): Promise<TargetAudience[]> {
    try {
      // Mock data - in a real implementation this would come from audience segmentation tables
      return [
        {
          id: '1',
          name: 'New Leads',
          criteria: { lead_status: 'new', created_within: '30_days' },
          estimated_size: 245
        },
        {
          id: '2', 
          name: 'Enterprise Prospects',
          criteria: { company_size: 'enterprise', industry: 'healthcare' },
          estimated_size: 89
        },
        {
          id: '3',
          name: 'Training Managers',
          criteria: { job_title: 'training_manager', lead_score: '>50' },
          estimated_size: 156
        }
      ];
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      return [];
    }
  }

  // Get default email templates
  static getDefaultEmailTemplates(): EmailTemplate[] {
    return [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Assured Response Training',
        template_type: 'welcome',
        variables: ['first_name', 'company_name'],
        is_active: true
      },
      {
        id: '2',
        name: 'Course Reminder',
        subject: 'Your upcoming training session',
        template_type: 'reminder',
        variables: ['first_name', 'course_name', 'date'],
        is_active: true
      },
      {
        id: '3',
        name: 'Follow-up Email',
        subject: 'Thank you for your interest',
        template_type: 'follow_up',
        variables: ['first_name', 'inquiry_type'],
        is_active: true
      }
    ];
  }
}
