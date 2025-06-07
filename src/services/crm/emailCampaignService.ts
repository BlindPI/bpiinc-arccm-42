
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

export class EmailCampaignService {
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
}
