
import { supabase } from '@/lib/supabase';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  subject_line: string;
  content: string;
  html_content?: string;
  sender_name: string;
  sender_email: string;
  reply_to_email?: string;
  target_audience: any;
  send_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  automation_rules?: any;
  tracking_enabled: boolean;
}

export interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_line: string;
  content: string;
  html_content?: string;
  variables: string[];
  created_at: Date;
  created_by: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

export class EmailCampaignService {
  static async getEmailCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      return [];
    }
  }

  static async createEmailCampaign(campaign: Partial<EmailCampaign>): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          ...campaign,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
        .from('email_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
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
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting email campaign:', error);
      throw error;
    }
  }

  static async getCampaignTemplates(): Promise<CampaignTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign templates:', error);
      return [];
    }
  }

  static async createCampaignTemplate(template: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign template:', error);
      throw error;
    }
  }

  static async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    try {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      throw error;
    }
  }

  static async getCampaignPerformanceSummary(): Promise<any> {
    try {
      // Mock data for now - in real implementation, this would calculate from actual data
      return {
        totalCampaigns: 24,
        activeCampaigns: 3,
        totalRecipients: 15420,
        averageOpenRate: 22.5,
        averageClickRate: 3.8,
        totalRevenue: 45600
      };
    } catch (error) {
      console.error('Error fetching campaign performance summary:', error);
      return null;
    }
  }

  static async sendCampaign(campaignId: string): Promise<void> {
    try {
      // Update campaign status to sending
      await this.updateEmailCampaign(campaignId, { status: 'sending' });
      
      // In a real implementation, this would trigger the email sending process
      console.log('Sending campaign:', campaignId);
      
      // Simulate sending delay and update status
      setTimeout(async () => {
        await this.updateEmailCampaign(campaignId, { status: 'sent' });
      }, 2000);
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }

  static async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.updateEmailCampaign(campaignId, { status: 'paused' });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  static async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await this.updateEmailCampaign(campaignId, { status: 'sending' });
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }

  static async duplicateCampaign(campaignId: string): Promise<EmailCampaign> {
    try {
      const { data: originalCampaign, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const duplicatedCampaign = {
        ...originalCampaign,
        campaign_name: `${originalCampaign.campaign_name} (Copy)`,
        status: 'draft',
        send_date: null,
        total_recipients: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        unsubscribed_count: 0
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

  static async getAutomationTriggers(): Promise<any[]> {
    try {
      // Mock data for automation triggers
      return [
        {
          id: '1',
          name: 'Lead Created',
          description: 'Triggered when a new lead is created',
          event_type: 'lead.created'
        },
        {
          id: '2',
          name: 'Deal Stage Changed',
          description: 'Triggered when a deal moves to a specific stage',
          event_type: 'deal.stage_changed'
        },
        {
          id: '3',
          name: 'Contact Birthday',
          description: 'Triggered on contact birthday',
          event_type: 'contact.birthday'
        }
      ];
    } catch (error) {
      console.error('Error fetching automation triggers:', error);
      return [];
    }
  }
}
