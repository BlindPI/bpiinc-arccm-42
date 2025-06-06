
import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  email_subject: string;
  email_content: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  delivered_count: number;
  campaign_cost: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate: number;
  roi: number;
  costPerLead: number;
  conversionRate: number;
}

export interface CampaignAnalytics {
  campaign: EmailCampaign;
  metrics: CampaignMetrics;
  performanceData: Array<{
    date: string;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
}

export class EmailCampaignService {
  static async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  static async createCampaign(
    campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  static async updateCampaign(
    id: string,
    updates: Partial<EmailCampaign>
  ): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      const { data: campaign, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const metrics = this.calculateCampaignMetrics(campaign);
      
      // Mock performance data - in a real implementation, this would come from tracking tables
      const performanceData = [
        { date: '2024-01', opens: campaign.opened_count || 0, clicks: campaign.clicked_count || 0, conversions: 5 },
        { date: '2024-02', opens: Math.floor((campaign.opened_count || 0) * 0.8), clicks: Math.floor((campaign.clicked_count || 0) * 0.8), conversions: 3 },
        { date: '2024-03', opens: Math.floor((campaign.opened_count || 0) * 0.6), clicks: Math.floor((campaign.clicked_count || 0) * 0.6), conversions: 2 }
      ];

      return {
        campaign,
        metrics,
        performanceData
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  static calculateCampaignMetrics(campaign: EmailCampaign): CampaignMetrics {
    const sentCount = campaign.sent_count || 0;
    const openedCount = campaign.opened_count || 0;
    const clickedCount = campaign.clicked_count || 0;
    const bouncedCount = campaign.bounced_count || 0;
    const deliveredCount = campaign.delivered_count || 0;

    return {
      openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
      clickRate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
      bounceRate: sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0,
      deliveryRate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
      roi: campaign.campaign_cost > 0 ? ((deliveredCount * 100) - campaign.campaign_cost) / campaign.campaign_cost * 100 : 0,
      costPerLead: deliveredCount > 0 ? campaign.campaign_cost / deliveredCount : 0,
      conversionRate: deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0
    };
  }

  static async deleteCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  static async sendCampaign(campaignId: string, recipientIds: string[]): Promise<void> {
    try {
      // In a real implementation, this would trigger email sending
      console.log(`Sending campaign ${campaignId} to ${recipientIds.length} recipients`);
      
      // Update sent count
      await this.updateCampaign(campaignId, {
        sent_count: recipientIds.length
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }
}
