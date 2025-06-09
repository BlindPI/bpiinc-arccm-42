
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaignService } from './emailCampaignService';

export interface CampaignWizardData {
  step1: {
    campaignName: string;
    campaignType: 'email' | 'lead_nurturing' | 'promotional';
    targetAudience: string;
    description?: string;
  };
  step2: {
    templateId?: string;
    subjectLine: string;
    emailContent: string;
    personalizationFields?: Record<string, any>;
  };
  step3: {
    geographicTargeting?: string[];
    industryTargeting?: string[];
    leadScoreThreshold?: number;
    scheduledDate?: string;
  };
}

export interface LeadNurturingCampaign {
  id: string;
  campaign_name: string;
  campaign_description?: string;
  sequence_config: any[];
  enrollment_criteria: Record<string, any>;
  is_active: boolean;
  total_enrolled: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface NurturingEnrollment {
  id: string;
  lead_id: string;
  campaign_id: string;
  enrollment_date: string;
  current_step: number;
  completion_status: 'active' | 'completed' | 'paused' | 'stopped';
  engagement_score: number;
  last_interaction_date?: string;
}

export interface CampaignROIData {
  campaignId: string;
  totalCost: number;
  revenueGenerated: number;
  roi: number;
  leadsGenerated: number;
  conversions: number;
  costPerLead: number;
  conversionRate: number;
}

export class CampaignManagementService {
  // Email Campaign Wizard
  static async createCampaignWizard(wizardData: CampaignWizardData): Promise<any> {
    try {
      const campaignData = {
        campaign_name: wizardData.step1.campaignName,
        campaign_type: wizardData.step1.campaignType,
        target_audience: wizardData.step1.targetAudience,
        subject_line: wizardData.step2.subjectLine,
        email_content: wizardData.step2.emailContent,
        geographic_targeting: wizardData.step3.geographicTargeting,
        industry_targeting: wizardData.step3.industryTargeting,
        scheduled_date: wizardData.step3.scheduledDate,
        status: 'draft' as const,
        personalization_fields: wizardData.step2.personalizationFields
      };

      return await EmailCampaignService.createEmailCampaign(campaignData);
    } catch (error) {
      console.error('Error creating campaign via wizard:', error);
      throw error;
    }
  }

  // Email Templates Management
  static async getEmailTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  static async createEmailTemplate(template: {
    template_name: string;
    template_type: string;
    subject_line: string;
    email_content: string;
    personalization_fields?: Record<string, any>;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('crm_email_templates')
        .insert({
          ...template,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  // Lead Nurturing Campaigns
  static async getLeadNurturingCampaigns(): Promise<LeadNurturingCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_nurturing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nurturing campaigns:', error);
      return [];
    }
  }

  static async createNurturingCampaign(campaign: {
    campaign_name: string;
    campaign_description?: string;
    sequence_config: any[];
    enrollment_criteria: Record<string, any>;
  }): Promise<LeadNurturingCampaign> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_nurturing_campaigns')
        .insert({
          ...campaign,
          is_active: true,
          total_enrolled: 0,
          completion_rate: 0
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

  static async enrollLeadInNurturing(leadId: string, campaignId: string): Promise<NurturingEnrollment> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_nurturing_enrollments')
        .insert({
          lead_id: leadId,
          campaign_id: campaignId,
          enrollment_date: new Date().toISOString(),
          current_step: 1,
          completion_status: 'active',
          engagement_score: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Update campaign enrollment count
      await supabase
        .from('crm_lead_nurturing_campaigns')
        .update({ 
          total_enrolled: supabase.sql`total_enrolled + 1` 
        })
        .eq('id', campaignId);

      return data;
    } catch (error) {
      console.error('Error enrolling lead in nurturing:', error);
      throw error;
    }
  }

  // Campaign Performance & ROI
  static async getCampaignROI(campaignId: string): Promise<CampaignROIData> {
    try {
      // Use the existing backend function
      const roi = await supabase.rpc('calculate_campaign_roi', {
        p_campaign_id: campaignId
      });

      const { data: campaign, error } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      return {
        campaignId,
        totalCost: campaign.campaign_cost || 0,
        revenueGenerated: campaign.revenue_attributed || 0,
        roi: roi.data || 0,
        leadsGenerated: campaign.leads_generated || 0,
        conversions: campaign.opportunities_created || 0,
        costPerLead: campaign.campaign_cost && campaign.leads_generated 
          ? campaign.campaign_cost / campaign.leads_generated 
          : 0,
        conversionRate: campaign.total_recipients && campaign.opportunities_created
          ? (campaign.opportunities_created / campaign.total_recipients) * 100
          : 0
      };
    } catch (error) {
      console.error('Error calculating campaign ROI:', error);
      throw error;
    }
  }

  static async getCampaignPerformanceMetrics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_campaign_performance')
        .select('*')
        .order('campaign_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      return [];
    }
  }

  // A/B Testing
  static async getABTestConfigs(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_ab_test_configs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching A/B test configs:', error);
      return [];
    }
  }

  static async createABTest(testConfig: {
    test_name: string;
    campaign_id: string;
    variable_tested: string;
    variant_a_config: Record<string, any>;
    variant_b_config: Record<string, any>;
    success_metric: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('crm_ab_test_configs')
        .insert({
          ...testConfig,
          is_active: true,
          traffic_split: 50,
          start_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // Geographic & Industry Analytics
  static async getCampaignGeographicPerformance(campaignId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('crm_campaign_geographic_performance')
        .select('*');

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query.order('total_sent', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching geographic performance:', error);
      return [];
    }
  }

  static async getCampaignIndustryPerformance(campaignId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('crm_campaign_industry_performance')
        .select('*');

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query.order('conversion_rate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching industry performance:', error);
      return [];
    }
  }

  // Real-time Campaign Tracking
  static async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      // This would typically be called by email service webhooks
      const { error } = await supabase.rpc('update_campaign_realtime_metrics', {
        p_campaign_id: campaignId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      throw error;
    }
  }
}
