
import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type?: string;
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  subject_line?: string;
  email_content?: string;
  target_audience?: string;
  target_segments?: Record<string, any>;
  personalization_fields?: Record<string, any>;
  email_template_id?: string;
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
  campaign_cost?: number;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_line: string;
  email_content: string;
  personalization_fields?: Record<string, any>;
  design_data?: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformance {
  campaign_id: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
  total_campaigns?: number;
  total_recipients?: number;
  avg_open_rate?: number;
  avg_click_rate?: number;
  total_revenue?: number;
}

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

  static async getEmailCampaigns(filters?: any): Promise<EmailCampaign[]> {
    return this.getCampaigns();
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

  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign | null> {
    return this.createCampaign(campaign);
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

  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
    return this.updateCampaign(id, updates);
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
      console.error('Error deleting campaign:', error);
      return false;
    }
  }

  static async sendCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .update({ status: 'sent', sent_date: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  }

  static async getCampaignPerformance(): Promise<CampaignPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('crm_campaign_performance')
        .select('*')
        .order('performance_date', { ascending: false });

      if (error) throw error;
      
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
        roi: 0, // Remove campaign_cost reference as it doesn't exist in schema
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

  static async getCampaignPerformanceSummary(): Promise<any> {
    const performance = await this.getCampaignPerformance();
    if (performance.length === 0) {
      return {
        total_campaigns: 0,
        total_recipients: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        total_revenue: 0
      };
    }

    return {
      total_campaigns: performance[0].total_campaigns || 0,
      total_recipients: performance[0].total_recipients || 0,
      avg_open_rate: performance[0].avg_open_rate || 0,
      avg_click_rate: performance[0].avg_click_rate || 0,
      total_revenue: performance[0].total_revenue || 0
    };
  }

  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(template => ({
        ...template,
        personalization_fields: typeof template.personalization_fields === 'string'
          ? JSON.parse(template.personalization_fields)
          : template.personalization_fields || {},
        design_data: typeof template.design_data === 'string'
          ? JSON.parse(template.design_data)
          : template.design_data || {}
      }));
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  static getDefaultEmailTemplates(): EmailTemplate[] {
    return [
      {
        id: '1',
        template_name: 'Welcome Email',
        template_type: 'welcome',
        subject_line: 'Welcome to our training program!',
        email_content: 'Welcome email content...',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        template_name: 'Follow-up Email',
        template_type: 'follow_up',
        subject_line: 'Following up on your training',
        email_content: 'Follow-up email content...',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        personalization_fields: typeof data.personalization_fields === 'string'
          ? JSON.parse(data.personalization_fields)
          : data.personalization_fields || {},
        design_data: typeof data.design_data === 'string'
          ? JSON.parse(data.design_data)
          : data.design_data || {}
      } : null;
    } catch (error) {
      console.error('Error creating email template:', error);
      return null;
    }
  }
}
