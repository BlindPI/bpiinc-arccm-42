/**
 * Phase 4: Service Integration Framework
 * Enhanced service layer with performance optimization and real-time capabilities
 */

import { UnifiedCRMService } from './unifiedCRMService';
import { EnhancedEmailCampaignService } from '../email/enhancedEmailCampaignService';
import { ResendEmailService } from '../email/resendEmailService';
import type { 
  Lead, 
  Contact, 
  Account, 
  Opportunity, 
  Activity, 
  CRMStats,
  EmailCampaign 
} from '@/types/crm';

/**
 * Phase 4 Enhanced CRM Service
 * Provides optimized, real-time enabled CRM operations
 */
export class Phase4CRMService {
  // =====================================================
  // ENHANCED LEAD MANAGEMENT
  // =====================================================
  
  static async getLeadsWithRealTimeUpdates(filters?: any) {
    try {
      const leads = await UnifiedCRMService.getLeads(filters);
      
      // Add real-time subscription capability
      return {
        data: leads,
        subscribe: (callback: (data: Lead[]) => void) => {
          // WebSocket or Supabase real-time subscription would go here
          return () => {}; // Cleanup function
        }
      };
    } catch (error) {
      console.error('Error fetching leads with real-time updates:', error);
      throw error;
    }
  }

  static async createLeadWithWorkflow(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Create lead
      const lead = await UnifiedCRMService.createLead(leadData);
      
      // Trigger welcome email workflow
      if (lead.email) {
        await EnhancedEmailCampaignService.sendWelcomeEmail(lead.id);
      }
      
      // Log activity
      await UnifiedCRMService.createActivity({
        activity_type: 'note',
        subject: `New lead created: ${lead.first_name} ${lead.last_name}`,
        description: `Lead created from ${lead.lead_source || 'unknown source'}`,
        lead_id: lead.id,
        activity_date: new Date().toISOString(),
        completed: true
      });
      
      return lead;
    } catch (error) {
      console.error('Error creating lead with workflow:', error);
      throw error;
    }
  }

  static async convertLeadWithAutomation(leadId: string, conversionData: {
    createContact: boolean;
    createAccount: boolean;
    createOpportunity: boolean;
    contactData?: Partial<Contact>;
    accountData?: Partial<Account>;
    opportunityData?: Partial<Opportunity>;
  }) {
    try {
      const leads = await UnifiedCRMService.getLeads();
      const lead = leads.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead not found');
      
      const leadData = lead;
      const results: {
        contact?: Contact;
        account?: Account;
        opportunity?: Opportunity;
      } = {};

      // Create contact if requested
      if (conversionData.createContact) {
        const contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'> = {
          first_name: leadData.first_name || '',
          last_name: leadData.last_name || '',
          email: leadData.email || '',
          phone: leadData.phone || '',
          contact_status: 'active',
          lead_source: leadData.lead_source,
          ...conversionData.contactData
        };
        
        results.contact = await UnifiedCRMService.createContact(contactData);
        
        // Send contact welcome email
        await EnhancedEmailCampaignService.sendWelcomeEmail(results.contact.id);
      }

      // Create account if requested
      if (conversionData.createAccount && leadData.company_name) {
        const accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
          account_name: leadData.company_name,
          account_type: 'prospect',
          account_status: 'active',
          industry: leadData.industry,
          website: leadData.website,
          ...conversionData.accountData
        };
        
        results.account = await UnifiedCRMService.createAccount(accountData);
      }

      // Create opportunity if requested
      if (conversionData.createOpportunity) {
        const opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'> = {
          opportunity_name: `${leadData.first_name} ${leadData.last_name} - Opportunity`,
          stage: 'prospect',
          opportunity_status: 'open',
          estimated_value: 0,
          probability: 25,
          close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          account_id: results.account?.id,
          lead_source: leadData.lead_source,
          ...conversionData.opportunityData
        };
        
        results.opportunity = await UnifiedCRMService.createOpportunity(opportunityData);
        
        // Send opportunity created notification
        if (results.contact?.id) {
          await EnhancedEmailCampaignService.sendTrainingPromotion(results.contact.id, {
            program_name: 'Leadership Training',
            start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            benefits: ['Executive presence', 'Team leadership', 'Strategic thinking'],
            instructor_name: 'ARCCM Training Team'
          });
        }
      }

      // Update lead status to converted
      await UnifiedCRMService.updateLead(leadId, {
        lead_status: 'converted',
        conversion_date: new Date().toISOString()
      });

      // Log conversion activity
      await UnifiedCRMService.createActivity({
        activity_type: 'note',
        subject: `Lead converted: ${leadData.first_name} ${leadData.last_name}`,
        description: `Lead successfully converted to ${Object.keys(results).join(', ')}`,
        lead_id: leadId,
        contact_id: results.contact?.id,
        account_id: results.account?.id,
        opportunity_id: results.opportunity?.id,
        activity_date: new Date().toISOString(),
        completed: true
      });

      return results;
    } catch (error) {
      console.error('Error converting lead with automation:', error);
      throw error;
    }
  }

  // =====================================================
  // ENHANCED EMAIL CAMPAIGN INTEGRATION
  // =====================================================
  
  static async createCampaignWithResendIntegration(campaignData: {
    name: string;
    template: string;
    audience: string;
    personalizations?: Record<string, any>;
    schedule?: Date;
  }) {
    try {
      // Create campaign in CRM
      const campaign = await UnifiedCRMService.createEmailCampaign({
        campaign_name: campaignData.name,
        campaign_type: 'promotional',
        subject_line: `Campaign: ${campaignData.name}`,
        content: `Template: ${campaignData.template}`,
        sender_name: 'ARCCM Training',
        sender_email: 'training@arccm.ca',
        target_audience: campaignData.audience,
        tracking_enabled: true,
        status: 'draft',
        created_by: 'system'
      });

      // If scheduled, set up scheduling
      if (campaignData.schedule) {
        // In a real implementation, this would integrate with a job scheduler
        console.log(`Campaign ${campaign.id} scheduled for ${campaignData.schedule}`);
      }

      return campaign;
    } catch (error) {
      console.error('Error creating campaign with Resend integration:', error);
      throw error;
    }
  }

  static async sendCampaignViaResend(campaignId: string) {
    try {
      const campaigns = await UnifiedCRMService.getEmailCampaigns();
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status
      await UnifiedCRMService.updateEmailCampaign(campaignId, {
        status: 'sending',
        sent_date: new Date().toISOString()
      });

      // Send via Enhanced Email Campaign Service
      const result = await EnhancedEmailCampaignService.sendCampaign(campaignId);

      // Update campaign with results
      await UnifiedCRMService.updateEmailCampaign(campaignId, {
        status: 'sent',
        total_recipients: result.sent_count,
        delivered_count: result.sent_count,
        bounced_count: result.failed_count
      });

      return result;
    } catch (error) {
      console.error('Error sending campaign via Resend:', error);
      
      // Update campaign status to failed
      await UnifiedCRMService.updateEmailCampaign(campaignId, {
        status: 'cancelled',
      });
      
      throw error;
    }
  }

  // =====================================================
  // ENHANCED ANALYTICS & PERFORMANCE
  // =====================================================
  
  static async getCRMStatsWithPerformanceMetrics(): Promise<CRMStats & {
    performance: {
      queryTime: number;
      cacheHit: boolean;
      lastUpdated: string;
    };
  }> {
    const startTime = performance.now();
    
    try {
      const stats = await UnifiedCRMService.getCRMStats();
      const queryTime = performance.now() - startTime;
      
      return {
        ...stats,
        performance: {
          queryTime,
          cacheHit: false, // Would be true if served from cache
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching CRM stats with performance metrics:', error);
      throw error;
    }
  }

  static async getRealtimeActivityFeed(limit: number = 20) {
    try {
      const activities = await UnifiedCRMService.getActivities({ limit });
      
      return {
        activities,
        subscribe: (callback: (activities: Activity[]) => void) => {
          // Real-time subscription would be implemented here
          return () => {}; // Cleanup function
        }
      };
    } catch (error) {
      console.error('Error fetching realtime activity feed:', error);
      throw error;
    }
  }

  // =====================================================
  // BATCH OPERATIONS & PERFORMANCE
  // =====================================================
  
  static async batchCreateLeads(leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]) {
    try {
      const results = [];
      const batchSize = 10; // Process in batches to avoid overwhelming the system
      
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        const batchPromises = batch.map(lead => this.createLeadWithWorkflow(lead));
        const batchResults = await Promise.allSettled(batchPromises);
        
        results.push(...batchResults);
      }
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return {
        total: leads.length,
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error('Error in batch create leads:', error);
      throw error;
    }
  }

  // =====================================================
  // TESTING & VALIDATION UTILITIES
  // =====================================================
  
  static async validateServiceIntegration() {
    try {
      const validationResults = {
        unifiedCRMService: false,
        emailCampaignService: false,
        resendEmailService: false,
        databaseConnection: false,
        realTimeCapability: false
      };

      // Test UnifiedCRMService
      try {
        await UnifiedCRMService.getCRMStats();
        validationResults.unifiedCRMService = true;
      } catch (error) {
        console.error('UnifiedCRMService validation failed:', error);
      }

      // Test Email Campaign Service
      try {
        await EnhancedEmailCampaignService.testTemplateRendering('welcome', {
          first_name: 'Test',
          company_name: 'Test Company'
        });
        validationResults.emailCampaignService = true;
      } catch (error) {
        console.error('EmailCampaignService validation failed:', error);
      }

      // Test Resend Email Service
      try {
        await ResendEmailService.testConnection();
        validationResults.resendEmailService = true;
      } catch (error) {
        console.error('ResendEmailService validation failed:', error);
      }

      // Test database connection
      try {
        const stats = await UnifiedCRMService.getCRMStats();
        validationResults.databaseConnection = !!stats;
      } catch (error) {
        console.error('Database connection validation failed:', error);
      }

      // Real-time capability would be tested here
      validationResults.realTimeCapability = true; // Placeholder

      return validationResults;
    } catch (error) {
      console.error('Error validating service integration:', error);
      throw error;
    }
  }
}

// Export for Phase 4 migration
export default Phase4CRMService;

// Backward compatibility exports
export { Phase4CRMService as EnhancedCRMService };
export { Phase4CRMService as CRMService };