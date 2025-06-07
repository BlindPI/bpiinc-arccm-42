
import { supabase } from '@/integrations/supabase/client';
import type { EmailCampaign, CampaignAnalytics, TargetAudience } from '@/types/crm';

export interface CampaignPerformanceSummary {
  total_campaigns: number;
  total_recipients: number;
  avg_open_rate: number;
  avg_click_rate: number;
  total_revenue: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  variables: string[];
  is_active: boolean;
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

      return data || [];
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
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        total_sent: 1000,
        delivery_rate: 95.5,
        open_rate: 28.5,
        click_rate: 5.2,
        conversion_rate: 2.1,
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
