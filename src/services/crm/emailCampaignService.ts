
import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  subject_line: string;
  target_audience?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_date?: string;
  sent_date?: string;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  leads_generated?: number;
  opportunities_created?: number;
  revenue_attributed?: number;
  created_by?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  revenueGenerated: number;
  leadsGenerated: number;
  roi: number;
}

export class EmailCampaignService {
  static async getEmailCampaigns(filters?: {
    status?: string;
    campaign_type?: string;
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

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      throw error;
    }
  }

  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id'>): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert({
          ...campaign,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
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
      throw error;
    }
  }

  static async deleteEmailCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting email campaign:', error);
      throw error;
    }
  }

  static async sendCampaign(campaignId: string): Promise<void> {
    try {
      // First update campaign status to 'sending'
      await this.updateEmailCampaign(campaignId, { 
        status: 'sending',
        sent_date: new Date().toISOString()
      });

      // Call edge function to send emails
      const { error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaignId }
      });

      if (error) throw error;

      // Update campaign status to 'sent'
      await this.updateEmailCampaign(campaignId, { status: 'sent' });
    } catch (error) {
      console.error('Error sending campaign:', error);
      // Update campaign status to 'paused' if sending failed
      await this.updateEmailCampaign(campaignId, { status: 'paused' });
      throw error;
    }
  }

  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const campaign = data;
      const totalSent = campaign.total_recipients || 0;
      const delivered = campaign.delivered_count || 0;
      const opened = campaign.opened_count || 0;
      const clicked = campaign.clicked_count || 0;
      const bounced = campaign.bounced_count || 0;
      const unsubscribed = campaign.unsubscribed_count || 0;

      return {
        campaignId,
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
        revenueGenerated: campaign.revenue_attributed || 0,
        leadsGenerated: campaign.leads_generated || 0,
        roi: this.calculateROI(campaign.revenue_attributed || 0, 0) // Cost would need to be tracked
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  static async exportCampaignData(campaignId?: string): Promise<string> {
    try {
      let query = supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const csvContent = [
        // Headers
        ['Campaign Name', 'Type', 'Status', 'Recipients', 'Delivered', 'Opened', 'Clicked', 'Open Rate', 'Click Rate', 'Revenue', 'Created Date'].join(','),
        // Data
        ...data.map(campaign => [
          `"${campaign.campaign_name}"`,
          campaign.campaign_type,
          campaign.status,
          campaign.total_recipients || 0,
          campaign.delivered_count || 0,
          campaign.opened_count || 0,
          campaign.clicked_count || 0,
          campaign.delivered_count ? ((campaign.opened_count || 0) / campaign.delivered_count * 100).toFixed(2) + '%' : '0%',
          campaign.opened_count ? ((campaign.clicked_count || 0) / campaign.opened_count * 100).toFixed(2) + '%' : '0%',
          campaign.revenue_attributed || 0,
          new Date(campaign.created_at).toLocaleDateString()
        ].join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting campaign data:', error);
      throw error;
    }
  }

  private static calculateROI(revenue: number, cost: number): number {
    if (cost === 0) return revenue > 0 ? 100 : 0;
    return ((revenue - cost) / cost) * 100;
  }

  static async duplicateCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      const { data: originalCampaign, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const duplicatedCampaign = {
        ...originalCampaign,
        campaign_name: `${originalCampaign.campaign_name} (Copy)`,
        status: 'draft' as const,
        scheduled_date: null,
        sent_date: null,
        total_recipients: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        unsubscribed_count: 0,
        leads_generated: 0,
        opportunities_created: 0,
        revenue_attributed: 0
      };

      delete duplicatedCampaign.id;
      delete duplicatedCampaign.created_at;
      delete duplicatedCampaign.updated_at;

      return await this.createEmailCampaign(duplicatedCampaign);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }
}
