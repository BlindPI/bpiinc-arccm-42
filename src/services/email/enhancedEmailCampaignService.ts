import { supabase } from '@/integrations/supabase/client';
import { ResendEmailService } from './resendEmailService';
import { PROFESSIONAL_EMAIL_TEMPLATES, getTemplateById } from './professionalEmailTemplates';
import { UnifiedCRMService } from '../crm/unifiedCRMService';
import type { EmailCampaign } from '@/types/crm';

interface CampaignRecipient {
  contact_id: string;
  email: string;
  first_name: string;
  last_name: string;
  personalization_data?: Record<string, string>;
}

interface CampaignResult {
  campaign_id: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  delivery_rate: number;
  errors: Array<{ email: string; error: string }>;
}

interface CampaignAnalytics {
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

/**
 * Enhanced Email Campaign Service
 * Professional email marketing with Resend integration and CRM synchronization
 */
export class EnhancedEmailCampaignService {

  /**
   * Create a new email campaign with professional templates
   */
  static async createCampaign(campaignData: {
    campaign_name: string;
    campaign_type: string;
    template_id: string;
    subject_line?: string;
    target_audience: 'all_contacts' | 'leads' | 'customers' | 'custom';
    custom_filters?: Record<string, any>;
    send_immediately?: boolean;
    scheduled_send_time?: Date;
    personalization_data?: Record<string, string>;
  }): Promise<EmailCampaign> {
    try {
      // Validate template exists
      const template = getTemplateById(campaignData.template_id);
      if (!template) {
        throw new Error(`Template ${campaignData.template_id} not found`);
      }

      // Create campaign record
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          campaign_name: campaignData.campaign_name,
          campaign_type: campaignData.campaign_type,
          subject_line: campaignData.subject_line || template.subject_template,
          content: template.html_template,
          sender_name: 'Professional Training Institute',
          sender_email: 'noreply@company.com',
          status: campaignData.send_immediately ? 'sending' : 'draft',
          send_date: campaignData.scheduled_send_time?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add recipients based on target audience
      await this.addCampaignRecipients(campaign.id, campaignData.target_audience, campaignData.custom_filters);

      // Send immediately if requested
      if (campaignData.send_immediately) {
        await this.sendCampaign(campaign.id);
      }

      return {
        ...campaign,
        created_at: new Date(campaign.created_at),
        updated_at: new Date(campaign.updated_at),
        send_date: campaign.send_date ? new Date(campaign.send_date) : undefined
      } as EmailCampaign;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  /**
   * Add recipients to campaign based on target audience
   */
  private static async addCampaignRecipients(
    campaignId: string,
    targetAudience: string,
    customFilters?: Record<string, any>
  ): Promise<void> {
    try {
      let recipients: CampaignRecipient[] = [];

      switch (targetAudience) {
        case 'all_contacts':
          const contacts = await UnifiedCRMService.getContacts();
          recipients = contacts.map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name
          }));
          break;

        case 'leads':
          const leads = await UnifiedCRMService.getLeads();
          recipients = leads.map(lead => ({
            contact_id: lead.id,
            email: lead.email,
            first_name: lead.first_name,
            last_name: lead.last_name
          }));
          break;

        case 'customers':
          const customerContacts = await UnifiedCRMService.getContacts({
            status: 'active'
          });
          recipients = customerContacts.map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name
          }));
          break;

        case 'custom':
          // Handle custom filters - simplified for now
          const customContacts = await UnifiedCRMService.getContacts();
          recipients = customContacts.slice(0, 50).map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name
          }));
          break;
      }

      // Insert recipients into campaign_recipients table (simplified)
      // In a real implementation, you'd have a proper campaign_recipients table
      console.log(`Added ${recipients.length} recipients to campaign ${campaignId}`);
      
    } catch (error) {
      console.error('Error adding campaign recipients:', error);
      throw error;
    }
  }

  /**
   * Send campaign using Resend API
   */
  static async sendCampaign(campaignId: string): Promise<CampaignResult> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Use default template for now since template_id is not in schema
      const template = getTemplateById('welcome-professional');
      if (!template) {
        throw new Error('Default template not found');
      }

      // Get recipients based on target audience
      let recipients: CampaignRecipient[] = [];
      
      switch (campaign.target_audience) {
        case 'all_contacts':
          const contacts = await UnifiedCRMService.getContacts({ limit: 100 });
          recipients = contacts.map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name
          }));
          break;

        case 'leads':
          const leads = await UnifiedCRMService.getLeads({ limit: 100 });
          recipients = leads.map(lead => ({
            contact_id: lead.id,
            email: lead.email,
            first_name: lead.first_name,
            last_name: lead.last_name
          }));
          break;

        default:
          const defaultContacts = await UnifiedCRMService.getContacts({ limit: 50 });
          recipients = defaultContacts.map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name
          }));
      }

      const result: CampaignResult = {
        campaign_id: campaignId,
        total_recipients: recipients.length,
        sent_count: 0,
        failed_count: 0,
        delivery_rate: 0,
        errors: []
      };

      // Send emails in batches
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (recipient) => {
            try {
              // Process template with personalization
              const personalizedSubject = this.processTemplate(
                campaign.subject_line || template.subject_template,
                {
                  first_name: recipient.first_name,
                  last_name: recipient.last_name,
                  company_name: 'Professional Training Institute'
                }
              );

              const personalizedContent = this.processTemplate(
                campaign.content || template.html_template,
                {
                  first_name: recipient.first_name,
                  last_name: recipient.last_name,
                  company_name: 'Professional Training Institute',
                  website_url: 'https://company.com',
                  contact_email: 'support@company.com',
                  unsubscribe_url: `https://company.com/unsubscribe?contact=${recipient.contact_id}`
                }
              );

              // Send via Resend
              await ResendEmailService.sendEmail({
                from: 'Professional Development <noreply@company.com>',
                to: recipient.email,
                subject: personalizedSubject,
                html: personalizedContent,
                tags: [
                  { name: 'campaign_id', value: campaignId },
                  { name: 'campaign_type', value: campaign.campaign_type }
                ]
              });

              result.sent_count++;
            } catch (error) {
              result.failed_count++;
              result.errors.push({
                email: recipient.email,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          })
        );

        // Rate limiting delay
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate delivery rate
      result.delivery_rate = result.total_recipients > 0 
        ? (result.sent_count / result.total_recipients) * 100 
        : 0;

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_count: result.sent_count,
          failed_count: result.failed_count,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Create campaign metrics record
      await this.createCampaignMetrics(campaignId, result);

      return result;
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new contact
   */
  static async sendWelcomeEmail(contactId: string): Promise<void> {
    try {
      await ResendEmailService.sendWelcomeEmail(contactId);
      
      // Log activity in CRM
      await UnifiedCRMService.createActivity({
        activity_type: 'email',
        subject: 'Welcome Email Sent',
        description: 'Professional welcome email sent to new contact',
        contact_id: contactId,
        activity_date: new Date().toISOString(),
        completed: true,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send training program promotion
   */
  static async sendTrainingPromotion(contactId: string, programDetails: {
    program_name: string;
    start_date: string;
    benefits: string[];
    instructor_name: string;
  }): Promise<void> {
    try {
      await ResendEmailService.sendTrainingPromotion(contactId, programDetails);
      
      // Log activity in CRM
      await UnifiedCRMService.createActivity({
        activity_type: 'email',
        subject: `Training Promotion: ${programDetails.program_name}`,
        description: `Sent training program promotion for ${programDetails.program_name}`,
        contact_id: contactId,
        activity_date: new Date().toISOString(),
        completed: true,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending training promotion:', error);
      throw error;
    }
  }

  /**
   * Send certification achievement email
   */
  static async sendCertificationAchievement(contactId: string, certificationDetails: {
    certification_name: string;
    certificate_url: string;
    achievement_date: string;
  }): Promise<void> {
    try {
      await ResendEmailService.sendCertificationAchievement(contactId, certificationDetails);
      
      // Log activity in CRM
      await UnifiedCRMService.createActivity({
        activity_type: 'email',
        subject: `Certification Achievement: ${certificationDetails.certification_name}`,
        description: `Sent certification achievement email for ${certificationDetails.certification_name}`,
        contact_id: contactId,
        activity_date: new Date().toISOString(),
        completed: true,
        priority: 'high'
      });
    } catch (error) {
      console.error('Error sending certification achievement email:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      const { data: metrics, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error) {
        // Return default metrics if not found
        return {
          campaign_id: campaignId,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0
        };
      }

      return metrics as CampaignAnalytics;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Get all professional email templates
   */
  static getProfessionalTemplates() {
    return PROFESSIONAL_EMAIL_TEMPLATES;
  }

  /**
   * Process template with variables
   */
  private static processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });

    return processed;
  }

  /**
   * Create campaign metrics record
   */
  private static async createCampaignMetrics(campaignId: string, result: CampaignResult): Promise<void> {
    try {
      // This would normally insert into campaign_metrics table
      // For now, we'll just log the metrics
      console.log('Campaign Metrics:', {
        campaign_id: campaignId,
        sent_count: result.sent_count,
        delivered_count: result.sent_count, // Assume all sent are delivered initially
        delivery_rate: result.delivery_rate,
        failed_count: result.failed_count
      });
    } catch (error) {
      console.error('Error creating campaign metrics:', error);
      // Don't throw here as it shouldn't fail the campaign send
    }
  }

  /**
   * Test email template rendering
   */
  static testTemplateRendering(templateId: string, testData: Record<string, string>): {
    subject: string;
    html: string;
    text: string;
  } {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const defaultData = {
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Professional Training Institute',
      website_url: 'https://company.com',
      contact_email: 'support@company.com',
      unsubscribe_url: 'https://company.com/unsubscribe',
      ...testData
    };

    return {
      subject: this.processTemplate(template.subject_template, defaultData),
      html: this.processTemplate(template.html_template, defaultData),
      text: this.processTemplate(template.text_template, defaultData)
    };
  }
}