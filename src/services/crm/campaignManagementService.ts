
import { supabase } from '@/integrations/supabase/client';
import type { EmailCampaign } from '@/types/crm';

export class CampaignManagementService {
  static transformCampaign(dbCampaign: any): EmailCampaign {
    return {
      ...dbCampaign,
      sent_count: dbCampaign.sent_count || 0,
      open_rate: dbCampaign.opened_count && dbCampaign.sent_count 
        ? (dbCampaign.opened_count / dbCampaign.sent_count) * 100 
        : 0,
      click_rate: dbCampaign.clicked_count && dbCampaign.sent_count 
        ? (dbCampaign.clicked_count / dbCampaign.sent_count) * 100 
        : 0,
      conversion_rate: dbCampaign.converted_count && dbCampaign.sent_count 
        ? (dbCampaign.converted_count / dbCampaign.sent_count) * 100 
        : 0
    };
  }

  static async getCampaigns(): Promise<EmailCampaign[]> {
    const { data, error } = await supabase
      .from('crm_email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformCampaign);
  }

  // Alias for compatibility
  static async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return this.getCampaigns();
  }

  static async createCampaign(campaignData: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await supabase
      .from('crm_email_campaigns')
      .insert({
        name: campaignData.campaign_name || 'Untitled Campaign',
        campaign_type: campaignData.campaign_type || 'promotional',
        subject: campaignData.subject_line || '',
        content: campaignData.email_content || '',
        target_audience: campaignData.target_audience || {},
        status: campaignData.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformCampaign(data);
  }

  // Wizard-specific creation method
  static async createCampaignWizard(campaignData: any): Promise<EmailCampaign> {
    return this.createCampaign({
      campaign_name: campaignData.name,
      campaign_type: campaignData.type,
      target_audience: campaignData.target_audience,
      subject_line: campaignData.subject || '',
      email_content: campaignData.content || '',
      status: 'draft'
    });
  }

  // Nurturing campaign creation
  static async createNurturingCampaign(campaignData: any): Promise<EmailCampaign> {
    return this.createCampaign({
      campaign_name: campaignData.campaign_name,
      campaign_type: 'nurturing',
      target_audience: campaignData.enrollment_criteria,
      email_content: JSON.stringify(campaignData.sequence_config),
      status: 'draft'
    });
  }

  static async updateCampaign(campaignId: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await supabase
      .from('crm_email_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return this.transformCampaign(data);
  }

  static async getCampaignMetrics(campaignId: string): Promise<any> {
    const { data, error } = await supabase
      .from('crm_email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    
    const campaign = this.transformCampaign(data);
    
    return {
      campaignId,
      sentCount: campaign.sent_count,
      openRate: campaign.open_rate,
      clickRate: campaign.click_rate,
      conversionRate: campaign.conversion_rate,
      roi: this.calculateROI(campaign)
    };
  }

  // Performance metrics method
  static async getCampaignPerformanceMetrics(): Promise<any[]> {
    const campaigns = await this.getCampaigns();
    return campaigns.map(campaign => ({
      campaign_id: campaign.id,
      opens: campaign.opened_count || 0,
      clicks: campaign.clicked_count || 0,
      conversions: campaign.converted_count || 0,
      roi: this.calculateROI(campaign)
    }));
  }

  private static calculateROI(campaign: EmailCampaign): number {
    if (!campaign.campaign_cost || campaign.campaign_cost === 0) return 0;
    const revenue = campaign.revenue_attributed || 0;
    return ((revenue - campaign.campaign_cost) / campaign.campaign_cost) * 100;
  }
}

export const campaignManagementService = new CampaignManagementService();
