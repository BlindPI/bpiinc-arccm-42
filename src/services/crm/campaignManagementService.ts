
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaign, CampaignWizardData } from '@/types/crm';

export class CampaignManagementService {
  static async getEmailCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      return [];
    }
  }

  static async createEmailCampaign(campaign: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
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

  static async getCampaignPerformanceMetrics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      return [];
    }
  }

  static async getEmailTemplates(): Promise<any[]> {
    try {
      // This would typically fetch from an email_templates table
      return [
        { id: '1', name: 'Welcome Email', content: 'Welcome template content' },
        { id: '2', name: 'Follow-up Email', content: 'Follow-up template content' },
        { id: '3', name: 'Newsletter', content: 'Newsletter template content' }
      ];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  static async createCampaignWizard(wizardData: CampaignWizardData): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert({
          campaign_name: wizardData.name,
          campaign_type: wizardData.type,
          target_audience: wizardData.target_audience,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign wizard:', error);
      throw error;
    }
  }

  static async createNurturingCampaign(campaignData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert({
          ...campaignData,
          campaign_type: 'nurturing',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating nurturing campaign:', error);
      throw error;
    }
  }
}
