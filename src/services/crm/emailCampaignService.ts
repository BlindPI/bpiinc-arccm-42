
import { supabase } from '@/integrations/supabase/client';
import type { EmailCampaign, EmailTemplate, CampaignPerformance } from '@/types/crm';

export class EmailCampaignService {
  static async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(campaign => ({
        ...campaign,
        status: (campaign.status as EmailCampaign['status']) || 'draft',
        target_segments: typeof campaign.target_segments === 'string' 
          ? JSON.parse(campaign.target_segments) 
          : campaign.target_segments || {},
        personalization_fields: typeof campaign.personalization_fields === 'string'
          ? JSON.parse(campaign.personalization_fields)
          : campaign.personalization_fields || {}
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  static async getCampaignById(id: string): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        status: (data.status as EmailCampaign['status']) || 'draft',
        target_segments: typeof data.target_segments === 'string' 
          ? JSON.parse(data.target_segments) 
          : data.target_segments || {},
        personalization_fields: typeof data.personalization_fields === 'string'
          ? JSON.parse(data.personalization_fields)
          : data.personalization_fields || {}
      } : null;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  static async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        status: (data.status as EmailCampaign['status']) || 'draft',
        target_segments: typeof data.target_segments === 'string' 
          ? JSON.parse(data.target_segments) 
          : data.target_segments || {},
        personalization_fields: typeof data.personalization_fields === 'string'
          ? JSON.parse(data.personalization_fields)
          : data.personalization_fields || {}
      } : null;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  static async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        status: (data.status as EmailCampaign['status']) || 'draft',
        target_segments: typeof data.target_segments === 'string' 
          ? JSON.parse(data.target_segments) 
          : data.target_segments || {},
        personalization_fields: typeof data.personalization_fields === 'string'
          ? JSON.parse(data.personalization_fields)
          : data.personalization_fields || {}
      } : null;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return null;
    }
  }

  static async getCampaignPerformance(): Promise<CampaignPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('crm_campaign_performance')
        .select('*')
        .order('performance_date', { ascending: false });

      if (error) throw error;
      
      // Calculate aggregated metrics
      const totalCampaigns = data?.length || 0;
      const totalRecipients = data?.reduce((sum, item) => sum + (item.emails_sent || 0), 0) || 0;
      const totalRevenue = data?.reduce((sum, item) => sum + (item.revenue_generated || 0), 0) || 0;
      const avgOpenRate = totalCampaigns > 0 
        ? (data?.reduce((sum, item) => sum + ((item.emails_opened || 0) / Math.max(item.emails_sent || 1, 1) * 100), 0) || 0) / totalCampaigns
        : 0;
      const avgClickRate = totalCampaigns > 0
        ? (data?.reduce((sum, item) => sum + ((item.emails_clicked || 0) / Math.max(item.emails_sent || 1, 1) * 100), 0) || 0) / totalCampaigns
        : 0;

      return (data || []).map(perf => ({
        campaign_id: perf.campaign_id,
        open_rate: perf.emails_sent > 0 ? (perf.emails_opened / perf.emails_sent) * 100 : 0,
        click_rate: perf.emails_sent > 0 ? (perf.emails_clicked / perf.emails_sent) * 100 : 0,
        conversion_rate: perf.emails_sent > 0 ? (perf.leads_generated / perf.emails_sent) * 100 : 0,
        roi: perf.campaign_cost > 0 ? ((perf.revenue_generated - perf.campaign_cost) / perf.campaign_cost) * 100 : 0,
        total_campaigns: totalCampaigns,
        total_recipients: totalRecipients,
        avg_open_rate: avgOpenRate,
        avg_click_rate: avgClickRate,
        total_revenue: totalRevenue
      }));
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      return [];
    }
  }

  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  static async getDefaultEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .select('*')
        .eq('template_type', 'default')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching default email templates:', error);
      return [];
    }
  }

  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating email template:', error);
      return null;
    }
  }
}
