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
  // Additional compatibility fields
  scheduled_date?: string;
  sent_date?: string;
  leads_generated?: number;
  opportunities_created?: number;
  revenue_attributed?: number;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  email_content?: string;
  target_segments?: Record<string, any>;
  personalization_fields?: Record<string, any>;
  email_template_id?: string;
  campaign_cost?: number;
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
  // Additional fields for compatibility
  name?: string;
  type?: string;
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
  static async getEmailCampaigns(filters?: { status?: string; campaign_type?: string }): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('email_campaigns')
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
        updated_at: new Date().toISOString(),
        // Use NULL for system-created campaigns if no user specified
        created_by: campaign.created_by || null
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
        updated_at: new Date().toISOString(),
        // Handle date conversion for created_at if present
        created_at: updates.created_at instanceof Date ? updates.created_at.toISOString() : updates.created_at
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

  static async updateCampaignTemplate(id: string, updates: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
    try {
      const updateData = {
        ...updates,
        // Handle date conversion if present
        created_at: updates.created_at instanceof Date ? updates.created_at.toISOString() : updates.created_at
      };

      const { data, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error updating campaign template:', error);
      throw error;
    }
  }

  static async deleteCampaignTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting campaign template:', error);
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
      // Get all campaigns from database
      const campaigns = await this.getEmailCampaigns();
      
      if (!campaigns || campaigns.length === 0) {
        return {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalRecipients: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
          totalRevenue: 0,
          avg_open_rate: 0,
          total_recipients: 0,
          total_revenue: 0,
          performanceData: [],
          engagementData: []
        };
      }

      // Calculate real metrics from database
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c =>
        c.status === 'sending' || c.status === 'scheduled'
      ).length;
      
      const totalRecipients = campaigns.reduce((sum, c) =>
        sum + (c.total_recipients || 0), 0
      );
      
      const totalDelivered = campaigns.reduce((sum, c) =>
        sum + (c.delivered_count || 0), 0
      );
      
      const totalOpened = campaigns.reduce((sum, c) =>
        sum + (c.opened_count || 0), 0
      );
      
      const totalClicked = campaigns.reduce((sum, c) =>
        sum + (c.clicked_count || 0), 0
      );
      
      const totalRevenue = campaigns.reduce((sum, c) =>
        sum + (c.revenue_attributed || 0), 0
      );

      const averageOpenRate = totalDelivered > 0 ?
        (totalOpened / totalDelivered) * 100 : 0;
      
      const averageClickRate = totalOpened > 0 ?
        (totalClicked / totalOpened) * 100 : 0;

      // Build performance data by campaign type
      const performanceByType = campaigns.reduce((acc, campaign) => {
        const type = campaign.campaign_type;
        if (!acc[type]) {
          acc[type] = {
            name: type,
            sent: 0,
            opened: 0,
            clicked: 0,
            converted: 0
          };
        }
        acc[type].sent += campaign.total_recipients || 0;
        acc[type].opened += campaign.opened_count || 0;
        acc[type].clicked += campaign.clicked_count || 0;
        if (campaign.status === 'sent') acc[type].converted += 1;
        return acc;
      }, {} as Record<string, any>);

      const performanceData = Object.values(performanceByType);

      // Build engagement data by month (last 6 months)
      const monthlyData = campaigns.reduce((acc, campaign) => {
        const month = campaign.created_at.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            date: month,
            totalDelivered: 0,
            totalOpened: 0,
            totalClicked: 0
          };
        }
        acc[month].totalDelivered += campaign.delivered_count || 0;
        acc[month].totalOpened += campaign.opened_count || 0;
        acc[month].totalClicked += campaign.clicked_count || 0;
        return acc;
      }, {} as Record<string, any>);

      const engagementData = Object.values(monthlyData)
        .map((month: any) => ({
          date: month.date,
          openRate: month.totalDelivered > 0 ?
            Math.round((month.totalOpened / month.totalDelivered) * 100 * 10) / 10 : 0,
          clickRate: month.totalOpened > 0 ?
            Math.round((month.totalClicked / month.totalOpened) * 100 * 10) / 10 : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-6); // Last 6 months

      console.log('📊 Generated performance data:', { performanceData, engagementData });

      return {
        totalCampaigns,
        activeCampaigns,
        totalRecipients,
        averageOpenRate: Math.round(averageOpenRate * 10) / 10,
        averageClickRate: Math.round(averageClickRate * 10) / 10,
        totalRevenue,
        // Additional fields for compatibility
        avg_open_rate: Math.round(averageOpenRate * 10) / 10,
        total_recipients: totalRecipients,
        total_revenue: totalRevenue,
        // Enhanced analytics data
        performanceData,
        engagementData
      };
    } catch (error) {
      console.error('Error fetching campaign performance summary:', error);
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRecipients: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        totalRevenue: 0,
        avg_open_rate: 0,
        total_recipients: 0,
        total_revenue: 0,
        performanceData: [],
        engagementData: []
      };
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

  static async exportCampaignData(campaignIds?: string[]): Promise<string> {
    try {
      const campaigns = await this.getEmailCampaigns();
      const filteredCampaigns = campaignIds ? campaigns.filter(c => campaignIds.includes(c.id)) : campaigns;
      
      // Convert to CSV format
      const headers = ['Campaign Name', 'Type', 'Status', 'Recipients', 'Open Rate', 'Click Rate', 'Created Date'];
      const csvRows = [headers.join(',')];
      
      filteredCampaigns.forEach(campaign => {
        const openRate = campaign.delivered_count ? Math.round(((campaign.opened_count || 0) / campaign.delivered_count) * 100) : 0;
        const clickRate = campaign.opened_count ? Math.round(((campaign.clicked_count || 0) / campaign.opened_count) * 100) : 0;
        
        const row = [
          `"${campaign.campaign_name}"`,
          campaign.campaign_type,
          campaign.status,
          campaign.total_recipients || 0,
          `${openRate}%`,
          `${clickRate}%`,
          campaign.created_at.toLocaleDateString()
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
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
