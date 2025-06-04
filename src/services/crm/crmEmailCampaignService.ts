import { supabase } from '@/integrations/supabase/client';
import { 
  CRMEmailCampaign, 
  CRMServiceResponse, 
  PaginatedResponse,
  CampaignMetrics,
  EmailTemplate
} from '@/types/crm';

export class CRMEmailCampaignService {
  /**
   * Create a new email campaign
   */
  async createCampaign(campaignData: {
    campaign_name: string;
    campaign_type: 'lead_nurture' | 'promotional' | 'educational' | 'follow_up';
    target_audience: 'individuals' | 'corporate' | 'potential_aps' | 'all';
    subject_line: string;
    email_template_id?: string;
    personalization_fields?: Record<string, any>;
    target_segments?: Record<string, any>;
    geographic_targeting?: string[];
    industry_targeting?: string[];
    scheduled_date?: string;
  }): Promise<CRMServiceResponse<CRMEmailCampaign>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .insert({
          ...campaignData,
          status: 'draft',
          total_recipients: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          leads_generated: 0,
          opportunities_created: 0,
          revenue_attributed: 0,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating email campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createCampaign:', error);
      return { success: false, error: 'Failed to create email campaign' };
    }
  }

  /**
   * Get email campaigns with filtering and pagination
   */
  async getCampaigns(
    filters: {
      campaign_type?: 'lead_nurture' | 'promotional' | 'educational' | 'follow_up';
      target_audience?: 'individuals' | 'corporate' | 'potential_aps' | 'all';
      status?: string;
      created_by?: string;
      date_from?: string;
      date_to?: string;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<CRMServiceResponse<PaginatedResponse<CRMEmailCampaign>>> {
    try {
      let query = supabase
        .from('crm_email_campaigns')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }
      if (filters.target_audience) {
        query = query.eq('target_audience', filters.target_audience);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching email campaigns:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      return { success: false, error: 'Failed to fetch email campaigns' };
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string): Promise<CRMServiceResponse<CRMEmailCampaign>> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching email campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getCampaign:', error);
      return { success: false, error: 'Failed to fetch email campaign' };
    }
  }

  /**
   * Update an email campaign
   */
  async updateCampaign(
    campaignId: string, 
    updates: Partial<CRMEmailCampaign>
  ): Promise<CRMServiceResponse<CRMEmailCampaign>> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        console.error('Error updating email campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateCampaign:', error);
      return { success: false, error: 'Failed to update email campaign' };
    }
  }

  /**
   * Schedule a campaign for sending
   */
  async scheduleCampaign(
    campaignId: string, 
    scheduledDate: string
  ): Promise<CRMServiceResponse<CRMEmailCampaign>> {
    try {
      // Get campaign details
      const campaign = await this.getCampaign(campaignId);
      if (!campaign.success || !campaign.data) {
        return { success: false, error: 'Campaign not found' };
      }

      // Calculate recipient count based on targeting
      const recipientCount = await this.calculateRecipientCount(campaign.data);

      const result = await this.updateCampaign(campaignId, {
        scheduled_date: scheduledDate,
        status: 'scheduled',
        total_recipients: recipientCount
      });

      return result;
    } catch (error) {
      console.error('Error in scheduleCampaign:', error);
      return { success: false, error: 'Failed to schedule campaign' };
    }
  }

  /**
   * Send a campaign immediately
   */
  async sendCampaign(campaignId: string): Promise<CRMServiceResponse<CRMEmailCampaign>> {
    try {
      // Get campaign details
      const campaign = await this.getCampaign(campaignId);
      if (!campaign.success || !campaign.data) {
        return { success: false, error: 'Campaign not found' };
      }

      // Get recipients based on targeting
      const recipients = await this.getTargetedRecipients(campaign.data);
      
      if (recipients.length === 0) {
        return { success: false, error: 'No recipients found for campaign targeting' };
      }

      // In a real implementation, this would integrate with an email service
      // For now, we'll simulate the sending process
      const deliveredCount = Math.floor(recipients.length * 0.95); // 95% delivery rate
      const openedCount = Math.floor(deliveredCount * 0.25); // 25% open rate
      const clickedCount = Math.floor(openedCount * 0.15); // 15% click rate
      const bouncedCount = recipients.length - deliveredCount;

      const result = await this.updateCampaign(campaignId, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        total_recipients: recipients.length,
        delivered_count: deliveredCount,
        opened_count: openedCount,
        clicked_count: clickedCount,
        bounced_count: bouncedCount
      });

      // Create follow-up activities for high-engagement recipients
      await this.createFollowUpActivities(campaignId, recipients.slice(0, clickedCount));

      return result;
    } catch (error) {
      console.error('Error in sendCampaign:', error);
      return { success: false, error: 'Failed to send campaign' };
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CRMServiceResponse<CampaignMetrics>> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign.success || !campaign.data) {
        return { success: false, error: 'Campaign not found' };
      }

      const data = campaign.data;
      const open_rate = data.total_recipients > 0 ? (data.opened_count / data.total_recipients) * 100 : 0;
      const click_rate = data.opened_count > 0 ? (data.clicked_count / data.opened_count) * 100 : 0;
      const conversion_rate = data.total_recipients > 0 ? (data.leads_generated / data.total_recipients) * 100 : 0;
      const roi = data.revenue_attributed > 0 ? ((data.revenue_attributed - 100) / 100) * 100 : 0; // Assuming $100 campaign cost

      const metrics: CampaignMetrics = {
        campaign_id: campaignId,
        campaign_name: data.campaign_name,
        open_rate,
        click_rate,
        conversion_rate,
        leads_generated: data.leads_generated,
        revenue_attributed: data.revenue_attributed,
        roi
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error in getCampaignMetrics:', error);
      return { success: false, error: 'Failed to get campaign metrics' };
    }
  }

  /**
   * Create a lead nurture sequence
   */
  async createNurtureSequence(
    sequenceName: string,
    targetAudience: 'individuals' | 'corporate' | 'potential_aps',
    emailTemplates: string[],
    dayIntervals: number[]
  ): Promise<CRMServiceResponse<CRMEmailCampaign[]>> {
    try {
      if (emailTemplates.length !== dayIntervals.length) {
        return { success: false, error: 'Email templates and day intervals must have the same length' };
      }

      const campaigns: CRMEmailCampaign[] = [];
      const baseDate = new Date();

      for (let i = 0; i < emailTemplates.length; i++) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + dayIntervals[i]);

        const campaignResult = await this.createCampaign({
          campaign_name: `${sequenceName} - Email ${i + 1}`,
          campaign_type: 'lead_nurture',
          target_audience: targetAudience,
          subject_line: `${sequenceName} - Follow-up ${i + 1}`,
          email_template_id: emailTemplates[i],
          scheduled_date: scheduledDate.toISOString()
        });

        if (campaignResult.success && campaignResult.data) {
          campaigns.push(campaignResult.data);
        }
      }

      return { success: true, data: campaigns };
    } catch (error) {
      console.error('Error in createNurtureSequence:', error);
      return { success: false, error: 'Failed to create nurture sequence' };
    }
  }

  /**
   * Track campaign engagement (opens, clicks)
   */
  async trackEngagement(
    campaignId: string,
    engagementType: 'open' | 'click' | 'unsubscribe',
    recipientEmail: string
  ): Promise<CRMServiceResponse<void>> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign.success || !campaign.data) {
        return { success: false, error: 'Campaign not found' };
      }

      const updates: Partial<CRMEmailCampaign> = {};

      switch (engagementType) {
        case 'open':
          updates.opened_count = (campaign.data.opened_count || 0) + 1;
          break;
        case 'click':
          updates.clicked_count = (campaign.data.clicked_count || 0) + 1;
          break;
        case 'unsubscribe':
          updates.unsubscribed_count = (campaign.data.unsubscribed_count || 0) + 1;
          break;
      }

      await this.updateCampaign(campaignId, updates);

      // Create activity record for high-value engagements
      if (engagementType === 'click') {
        await this.createEngagementActivity(campaignId, recipientEmail, engagementType);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackEngagement:', error);
      return { success: false, error: 'Failed to track engagement' };
    }
  }

  /**
   * Get campaign performance summary
   */
  async getCampaignSummary(
    startDate: string,
    endDate: string
  ): Promise<CRMServiceResponse<{
    total_campaigns: number;
    total_recipients: number;
    avg_open_rate: number;
    avg_click_rate: number;
    total_leads_generated: number;
    total_revenue_attributed: number;
    campaigns_by_type: Record<string, number>;
  }>> {
    try {
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('campaign_type, total_recipients, opened_count, clicked_count, leads_generated, revenue_attributed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('Error fetching campaign summary:', error);
        return { success: false, error: error.message };
      }

      const campaigns = data || [];
      const total_campaigns = campaigns.length;
      const total_recipients = campaigns.reduce((sum, c) => sum + c.total_recipients, 0);
      const total_opens = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
      const total_clicks = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);
      const total_leads_generated = campaigns.reduce((sum, c) => sum + c.leads_generated, 0);
      const total_revenue_attributed = campaigns.reduce((sum, c) => sum + c.revenue_attributed, 0);

      const avg_open_rate = total_recipients > 0 ? (total_opens / total_recipients) * 100 : 0;
      const avg_click_rate = total_opens > 0 ? (total_clicks / total_opens) * 100 : 0;

      const campaigns_by_type = campaigns.reduce((acc, campaign) => {
        acc[campaign.campaign_type] = (acc[campaign.campaign_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          total_campaigns,
          total_recipients,
          avg_open_rate,
          avg_click_rate,
          total_leads_generated,
          total_revenue_attributed,
          campaigns_by_type
        }
      };
    } catch (error) {
      console.error('Error in getCampaignSummary:', error);
      return { success: false, error: 'Failed to get campaign summary' };
    }
  }

  // Private helper methods

  private async calculateRecipientCount(campaign: CRMEmailCampaign): Promise<number> {
    try {
      let query = supabase.from('crm_leads').select('id', { count: 'exact', head: true });

      // Apply audience targeting
      if (campaign.target_audience !== 'all') {
        const leadType = campaign.target_audience === 'individuals' ? 'individual' :
                        campaign.target_audience === 'corporate' ? 'corporate' : 'potential_ap';
        query = query.eq('lead_type', leadType);
      }

      // Apply geographic targeting
      if (campaign.geographic_targeting && campaign.geographic_targeting.length > 0) {
        query = query.in('province', campaign.geographic_targeting);
      }

      // Apply industry targeting
      if (campaign.industry_targeting && campaign.industry_targeting.length > 0) {
        query = query.in('industry', campaign.industry_targeting);
      }

      const { count } = await query;
      return count || 0;
    } catch (error) {
      console.error('Error calculating recipient count:', error);
      return 0;
    }
  }

  private async getTargetedRecipients(campaign: CRMEmailCampaign): Promise<{ id: string; email: string; lead_type: string }[]> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('id, email, lead_type')
        .not('email', 'is', null);

      // Apply audience targeting
      if (campaign.target_audience !== 'all') {
        const leadType = campaign.target_audience === 'individuals' ? 'individual' :
                        campaign.target_audience === 'corporate' ? 'corporate' : 'potential_ap';
        query = query.eq('lead_type', leadType);
      }

      // Apply geographic targeting
      if (campaign.geographic_targeting && campaign.geographic_targeting.length > 0) {
        query = query.in('province', campaign.geographic_targeting);
      }

      // Apply industry targeting
      if (campaign.industry_targeting && campaign.industry_targeting.length > 0) {
        query = query.in('industry', campaign.industry_targeting);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting targeted recipients:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTargetedRecipients:', error);
      return [];
    }
  }

  private async createFollowUpActivities(
    campaignId: string, 
    engagedRecipients: { id: string; email: string }[]
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const activities = engagedRecipients.map(recipient => ({
        lead_id: recipient.id,
        activity_type: 'follow_up' as const,
        subject: 'Email Campaign Follow-up',
        description: `Follow-up required for lead who engaged with email campaign ${campaignId}`,
        activity_date: new Date().toISOString(),
        outcome: 'positive' as const,
        created_by: user?.id
      }));

      if (activities.length > 0) {
        await supabase.from('crm_activities').insert(activities);
      }
    } catch (error) {
      console.error('Error creating follow-up activities:', error);
    }
  }

  private async createEngagementActivity(
    campaignId: string,
    recipientEmail: string,
    engagementType: string
  ): Promise<void> {
    try {
      // Find the lead by email
      const { data: lead } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (lead) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('crm_activities').insert({
          lead_id: lead.id,
          activity_type: 'email',
          subject: `Email Campaign ${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}`,
          description: `Lead ${engagementType}ed email from campaign ${campaignId}`,
          activity_date: new Date().toISOString(),
          outcome: 'positive',
          created_by: user?.id
        });
      }
    } catch (error) {
      console.error('Error creating engagement activity:', error);
    }
  }
}

export const crmEmailCampaignService = new CRMEmailCampaignService();