
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

export interface CampaignPerformance {
  campaign_id: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
}

export class EmailCampaignService {
  static async getEmailCampaigns(filters?: any): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      return [];
    }
  }

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

  static async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .update({ 
          status: 'sent',
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

  static async getCampaignPerformanceSummary(): Promise<CampaignPerformance[]> {
    try {
      const { data: campaigns, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('status', 'sent');

      if (error) throw error;

      return (campaigns || []).map(campaign => ({
        campaign_id: campaign.id,
        open_rate: campaign.total_recipients > 0 ? 
          ((campaign.opened_count || 0) / campaign.total_recipients) * 100 : 0,
        click_rate: campaign.opened_count > 0 ? 
          ((campaign.clicked_count || 0) / campaign.opened_count) * 100 : 0,
        conversion_rate: campaign.total_recipients > 0 ? 
          ((campaign.leads_generated || 0) / campaign.total_recipients) * 100 : 0,
        roi: campaign.campaign_cost > 0 ? 
          ((campaign.revenue_attributed || 0) - campaign.campaign_cost) / campaign.campaign_cost * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      return [];
    }
  }
}
