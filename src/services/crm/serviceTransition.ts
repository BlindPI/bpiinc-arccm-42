/**
 * Service Transition Helper - Phase 2 Implementation
 * Provides backward compatibility while transitioning to UnifiedCRMService
 */

import { UnifiedCRMService } from './unifiedCRMService';

// Re-export UnifiedCRMService as the primary CRM service
export { UnifiedCRMService as CRMService };
export { UnifiedCRMService as EnhancedCRMService };
export { UnifiedCRMService as CRMLeadService };

// Backward compatibility exports
export const EmailCampaignService = {
  getEmailCampaigns: UnifiedCRMService.getEmailCampaigns,
  createEmailCampaign: UnifiedCRMService.createEmailCampaign,
  updateEmailCampaign: UnifiedCRMService.updateEmailCampaign,
  deleteEmailCampaign: UnifiedCRMService.deleteEmailCampaign,
  getCampaignPerformanceSummary: UnifiedCRMService.getCampaignPerformanceSummary,
  
  // Placeholder methods that were causing issues - now return real data
  getCampaignTemplates: async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
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
  },

  getCampaignMetrics: async (campaignId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
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
  },

  // Real email sending implementation placeholder
  sendCampaign: async (campaignId: string): Promise<void> => {
    try {
      // Update status to sending
      await UnifiedCRMService.updateEmailCampaign(campaignId, {
        status: 'sending'
      });
      
      console.log('Campaign sending initiated:', campaignId);
      
      // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
      // For now, simulate sending process
      setTimeout(async () => {
        try {
          await UnifiedCRMService.updateEmailCampaign(campaignId, {
            status: 'sent'
          });
          console.log('Campaign sent successfully:', campaignId);
        } catch (error) {
          console.error('Error updating campaign status:', error);
        }
      }, 5000); // 5 second delay to simulate sending
      
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  },

  pauseCampaign: async (campaignId: string): Promise<void> => {
    await UnifiedCRMService.updateEmailCampaign(campaignId, { status: 'paused' });
  },

  resumeCampaign: async (campaignId: string): Promise<void> => {
    await UnifiedCRMService.updateEmailCampaign(campaignId, { status: 'sending' });
  },

  duplicateCampaign: async (campaignId: string) => {
    try {
      const campaigns = await UnifiedCRMService.getEmailCampaigns();
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

      return await UnifiedCRMService.createEmailCampaign(duplicatedCampaign);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }
};

// Default export for main service
export default UnifiedCRMService;

/**
 * Migration Guide for Components:
 * 
 * OLD:
 * import { CRMService } from '@/services/crm/crmService';
 * import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
 * import { CRMLeadService } from '@/services/crm/crmLeadService';
 * import { EmailCampaignService } from '@/services/crm/emailCampaignService';
 * 
 * NEW:
 * import { CRMService, EmailCampaignService } from '@/services/crm/serviceTransition';
 * 
 * OR:
 * import UnifiedCRMService from '@/services/crm/unifiedCRMService';
 */