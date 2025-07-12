import { supabase } from '@/integrations/supabase/client';

// Resend API types
interface ResendEmailData {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  tags?: Array<{ name: string; value: string }>;
}

interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string | null;
  category: string | null;
  subject_template: string | null;
  html_template: string | null;
  text_template?: string | null;
  variables: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface EmailCampaignResult {
  campaign_id: string;
  sent_count: number;
  failed_count: number;
  email_ids: string[];
  errors: Array<{ email: string; error: string }>;
}

/**
 * Professional Email Service using Resend API
 * Implements enterprise-grade email delivery with professional templates
 */
export class ResendEmailService {
  private static readonly RESEND_API_URL = 'https://api.resend.com';
  private static resendApiKey: string | null = null;

  /**
   * Initialize Resend API key from Supabase secrets
   */
  private static async getResendApiKey(): Promise<string> {
    if (this.resendApiKey) {
      return this.resendApiKey;
    }

    try {
      // For now, we'll use environment variable or hardcoded approach
      // In production, this should be retrieved from Supabase secrets
      const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || 'your-resend-api-key';
      
      if (!apiKey || apiKey === 'your-resend-api-key') {
        throw new Error('Resend API key not configured');
      }

      this.resendApiKey = apiKey;
      return apiKey;
    } catch (error) {
      console.error('Error initializing Resend API key:', error);
      throw error;
    }
  }

  /**
   * Send individual email via Resend API
   */
  static async sendEmail(emailData: ResendEmailData): Promise<ResendResponse> {
    try {
      const apiKey = await this.getResendApiKey();

      const response = await fetch(`${this.RESEND_API_URL}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Log email send to database
      await ResendEmailService.logEmailSend({
        resend_id: result.id,
        recipient_email: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
        subject: emailData.subject,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new lead/contact
   */
  static async sendWelcomeEmail(contactId: string): Promise<ResendResponse> {
    try {
      // Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Get welcome email template
      const template = await ResendEmailService.getTemplate('welcome-professional');
      
      // Prepare email data with professional template
      const emailData: ResendEmailData = {
        from: 'Professional Development <noreply@company.com>',
        to: contact.email,
        subject: ResendEmailService.processTemplate(template.subject_template, {
          first_name: contact.first_name,
          company_name: 'Professional Training Institute'
        }),
        html: ResendEmailService.processTemplate(template.html_template, {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_name: 'Professional Training Institute',
          contact_email: 'support@company.com',
          website_url: 'https://company.com',
          unsubscribe_url: `https://company.com/unsubscribe?contact=${contactId}`
        }),
        tags: [
          { name: 'campaign_type', value: 'welcome' },
          { name: 'contact_id', value: contactId }
        ]
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send training program promotion email
   */
  static async sendTrainingPromotion(contactId: string, programDetails: {
    program_name: string;
    start_date: string;
    benefits: string[];
    instructor_name: string;
  }): Promise<ResendResponse> {
    try {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      const template = await ResendEmailService.getTemplate('training-program-promotion');
      
      const emailData: ResendEmailData = {
        from: 'Training Programs <training@company.com>',
        to: contact.email,
        subject: ResendEmailService.processTemplate(template.subject_template, {
          first_name: contact.first_name,
          program_name: programDetails.program_name
        }),
        html: ResendEmailService.processTemplate(template.html_template, {
          first_name: contact.first_name,
          program_name: programDetails.program_name,
          start_date: programDetails.start_date,
          benefits: programDetails.benefits.join(', '),
          instructor_name: programDetails.instructor_name,
          company_name: 'Professional Training Institute',
          unsubscribe_url: `https://company.com/unsubscribe?contact=${contactId}`
        }),
        tags: [
          { name: 'campaign_type', value: 'training_promotion' },
          { name: 'program_name', value: programDetails.program_name }
        ]
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending training promotion email:', error);
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
  }): Promise<ResendResponse> {
    try {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      const template = await ResendEmailService.getTemplate('certification-achievement');
      
      const emailData: ResendEmailData = {
        from: 'Certifications <certifications@company.com>',
        to: contact.email,
        subject: ResendEmailService.processTemplate(template.subject_template, {
          first_name: contact.first_name,
          certification_name: certificationDetails.certification_name
        }),
        html: ResendEmailService.processTemplate(template.html_template, {
          first_name: contact.first_name,
          certification_name: certificationDetails.certification_name,
          certificate_url: certificationDetails.certificate_url,
          achievement_date: certificationDetails.achievement_date,
          company_name: 'Professional Training Institute',
          unsubscribe_url: `https://company.com/unsubscribe?contact=${contactId}`
        }),
        tags: [
          { name: 'campaign_type', value: 'certification' },
          { name: 'certification_name', value: certificationDetails.certification_name }
        ]
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending certification achievement email:', error);
      throw error;
    }
  }

  /**
   * Send bulk email campaign
   */
  static async sendBulkCampaign(campaignId: string): Promise<EmailCampaignResult> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Get campaign recipients - simplified for now
      const { data: recipients, error: recipientsError } = await supabase
        .from('crm_contacts')
        .select('id, email, first_name, last_name')
        .limit(100); // Limit for testing

      if (recipientsError) throw recipientsError;

      const results: EmailCampaignResult = {
        campaign_id: campaignId,
        sent_count: 0,
        failed_count: 0,
        email_ids: [],
        errors: []
      };

      // Get email template - use default for now
      const defaultTemplate = {
        subject_template: campaign.subject || 'Professional Development Update',
        html_template: campaign.content || '<p>Hello {{first_name}},</p><p>Thank you for your interest in professional development.</p>'
      };

      // Send emails in batches to avoid rate limits
      const batchSize = 10; // Smaller batch for testing
      for (let i = 0; i < (recipients || []).length; i += batchSize) {
        const batch = (recipients || []).slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (contact) => {
            try {
              const emailData: ResendEmailData = {
                from: campaign.from_email || 'Professional Development <noreply@company.com>',
                to: contact.email,
                subject: ResendEmailService.processTemplate(defaultTemplate.subject_template, {
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                  company_name: 'Professional Training Institute'
                }),
                html: ResendEmailService.processTemplate(defaultTemplate.html_template, {
                  first_name: contact.first_name,
                  last_name: contact.last_name,
                  company_name: 'Professional Training Institute',
                  unsubscribe_url: `https://company.com/unsubscribe?contact=${contact.id}`
                }),
                tags: [
                  { name: 'campaign_id', value: campaignId },
                  { name: 'campaign_type', value: campaign.campaign_type || 'bulk' }
                ]
              };

              const response = await ResendEmailService.sendEmail(emailData);
              results.sent_count++;
              results.email_ids.push(response.id);
            } catch (error) {
              results.failed_count++;
              results.errors.push({
                email: contact.email,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          })
        );

        // Add delay between batches to respect rate limits
        if (i + batchSize < (recipients || []).length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_count: results.sent_count,
          failed_count: results.failed_count,
          sent_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      return results;
    } catch (error) {
      console.error('Error sending bulk campaign:', error);
      throw error;
    }
  }

  /**
   * Get email template by name
   */
  private static async getTemplate(templateName: string): Promise<EmailTemplate> {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      throw new Error(`Email template '${templateName}' not found`);
    }

    return template;
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
   * Log email send to database
   */
  private static async logEmailSend(logData: {
    resend_id: string;
    recipient_email: string;
    subject: string;
    status: string;
    sent_at: string;
  }): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert(logData);
    } catch (error) {
      console.error('Error logging email send:', error);
      // Don't throw here as it shouldn't fail the email send
    }
  }

  /**
   * Get email delivery status from Resend
   */
  static async getEmailStatus(resendId: string): Promise<any> {
    try {
      const apiKey = await this.getResendApiKey();

      const response = await fetch(`${this.RESEND_API_URL}/emails/${resendId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get email status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting email status:', error);
      throw error;
    }
  }

  /**
   * Test Resend API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const testEmail: ResendEmailData = {
        from: 'Test <test@company.com>',
        to: 'test@example.com',
        subject: 'Resend API Test',
        html: '<p>This is a test email to verify Resend API connection.</p>',
        tags: [{ name: 'test', value: 'connection' }]
      };

      // This will fail with invalid email but will test API connection
      await this.sendEmail(testEmail);
      return true;
    } catch (error) {
      // If error is about invalid email, API connection is working
      if (error instanceof Error && error.message.includes('Invalid')) {
        return true;
      }
      console.error('Resend API connection test failed:', error);
      return false;
    }
  }
}