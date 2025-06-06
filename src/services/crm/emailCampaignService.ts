
import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  subject_line?: string;
  email_content?: string;
  target_audience?: string;
  status: string;
  scheduled_date?: string;
  sent_date?: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  leads_generated: number;
  opportunities_created?: number;
  revenue_attributed: number;
  campaign_cost: number;
  created_by?: string;
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
  // Alias methods for backward compatibility
  static async getEmailCampaigns(filters?: any): Promise<EmailCampaign[]> {
    return this.getCampaigns();
  }

  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign> {
    return this.createCampaign(campaign);
  }

  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    return this.updateCampaign(id, updates);
  }

  static async deleteEmailCampaign(id: string): Promise<void> {
    return this.deleteCampaign(id);
  }

  static async getCampaignPerformanceSummary() {
    try {
      const campaigns = await this.getCampaigns();
      
      const summary = {
        total_campaigns: campaigns.length,
        total_recipients: campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0),
        total_delivered: campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0),
        total_opened: campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0),
        avg_open_rate: 0,
        avg_click_rate: 0,
        total_revenue: campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0)
      };

      if (summary.total_delivered > 0) {
        summary.avg_open_rate = (summary.total_opened / summary.total_delivered) * 100;
      }

      const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
      if (summary.total_opened > 0) {
        summary.avg_click_rate = (totalClicks / summary.total_opened) * 100;
      }

      return summary;
    } catch (error) {
      console.error('Error getting campaign performance summary:', error);
      return {
        total_campaigns: 0,
        total_recipients: 0,
        total_delivered: 0,
        total_opened: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        total_revenue: 0
      };
    }
  }

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
    const sentCount = campaign.total_recipients || 0;
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

  static async sendCampaign(campaignId: string, recipientIds?: string[]): Promise<void> {
    try {
      // In a real implementation, this would trigger email sending
      const recipients = recipientIds || [];
      console.log(`Sending campaign ${campaignId} to ${recipients.length} recipients`);
      
      // Update sent count and status
      await this.updateCampaign(campaignId, {
        total_recipients: recipients.length,
        status: 'sent',
        sent_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }
}
