import { supabase } from '@/integrations/supabase/client';

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
      
      // Transform the data to match our interface
      return (data || []).map(campaign => ({
        ...campaign,
        campaign_type: campaign.campaign_type as EmailCampaign['campaign_type'],
        status: campaign.status as EmailCampaign['status'],
        created_at: new Date(campaign.created_at),
        updated_at: new Date(campaign.updated_at),
        send_date: campaign.send_date ? new Date(campaign.send_date) : undefined
      }));
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      return [];
    }
  }

  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign> {
    try {
      const campaignData = {
        ...campaign,
        send_date: campaign.send_date?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        campaign_type: data.campaign_type as EmailCampaign['campaign_type'],
        status: data.status as EmailCampaign['status'],
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        send_date: data.send_date ? new Date(data.send_date) : undefined
      };
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    try {
      const updateData = {
        ...updates,
        send_date: updates.send_date?.toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        campaign_type: data.campaign_type as EmailCampaign['campaign_type'],
        status: data.status as EmailCampaign['status'],
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        send_date: data.send_date ? new Date(data.send_date) : undefined
      };
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
      
      return (data || []).map(template => ({
        ...template,
        created_at: new Date(template.created_at)
      }));
    } catch (error) {
      console.error('Error fetching campaign templates:', error);
      return [];
    }
  }

  static async createCampaignTemplate(template: Omit<CampaignTemplate, 'id' | 'created_at'>): Promise<CampaignTemplate> {
    try {
      const templateData = {
        ...template,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at)
      };
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
      await this.updateEmailCampaign(campaignId, { status: 'sending' });
      console.log('Sending campaign:', campaignId);
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
      const campaigns = await this.getEmailCampaigns();
      const originalCampaign = campaigns.find(c => c.id === campaignId);
      
      if (!originalCampaign) throw new Error('Campaign not found');

      const duplicatedCampaign = {
        campaign_name: `${originalCampaign.campaign_name} (Copy)`,
        campaign_type: originalCampaign.campaign_type,
        status: 'draft' as const,
        subject_line: originalCampaign.subject_line,
        content: originalCampaign.content,
        html_content: originalCampaign.html_content,
        sender_name: originalCampaign.sender_name,
        sender_email: originalCampaign.sender_email,
        reply_to_email: originalCampaign.reply_to_email,
        target_audience: originalCampaign.target_audience,
        created_by: originalCampaign.created_by,
        tracking_enabled: originalCampaign.tracking_enabled,
        automation_rules: originalCampaign.automation_rules
      };

      return await this.createEmailCampaign(duplicatedCampaign);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }

  static async exportCampaignData(campaignIds: string[]): Promise<any> {
    try {
      const campaigns = await this.getEmailCampaigns();
      return campaigns.filter(c => campaignIds.includes(c.id));
    } catch (error) {
      console.error('Error exporting campaign data:', error);
      throw error;
    }
  }

  static async getDefaultEmailTemplates(): Promise<CampaignTemplate[]> {
    try {
      return [
        {
          id: 'default-1',
          template_name: 'Welcome Email',
          template_type: 'welcome',
          subject_line: 'Welcome to {{company_name}}!',
          content: 'Thank you for joining us, {{first_name}}!',
          variables: ['company_name', 'first_name'],
          created_at: new Date(),
          created_by: 'system'
        },
        {
          id: 'default-2',
          template_name: 'Newsletter',
          template_type: 'newsletter',
          subject_line: 'Monthly Newsletter - {{month}}',
          content: 'Here are the latest updates...',
          variables: ['month'],
          created_at: new Date(),
          created_by: 'system'
        }
      ];
    } catch (error) {
      console.error('Error fetching default templates:', error);
      return [];
    }
  }

  static async getAutomationTriggers(): Promise<any[]> {
    try {
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
