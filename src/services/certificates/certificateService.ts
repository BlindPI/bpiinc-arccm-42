
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { FontCache } from '@/hooks/useFontLoader';
import { AuditLogService } from '@/services/audit/auditLogService';
import { NotificationProcessor } from '@/services/notifications/notificationProcessor';
import { format } from 'date-fns';

export interface CertificateGenerationRequest {
  recipientName: string;
  recipientEmail?: string;
  courseName: string;
  courseId?: string;
  locationId?: string;
  issueDate: string;
  expiryDate: string;
  instructorName?: string;
  rosterId?: string;
  batchId?: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate: any;
  status: string;
}

export class CertificateService {
  static async generateCertificate(
    request: CertificateGenerationRequest,
    fontCache: FontCache,
    options: {
      sendEmail?: boolean;
      templateId?: string;
      userId?: string;
    } = {}
  ): Promise<{ certificateId: string; pdfUrl: string }> {
    try {
      console.log('Starting certificate generation for:', request.recipientName);

      // Get template URL
      const templateUrl = await this.getTemplateUrl(options.templateId, request.locationId);
      
      // Format dates properly
      const formattedRequest = {
        ...request,
        issueDate: this.formatDate(request.issueDate),
        expiryDate: this.formatDate(request.expiryDate)
      };

      // Generate PDF with correct parameter mapping
      const pdfBytes = await generateCertificatePDF(
        templateUrl,
        {
          name: formattedRequest.recipientName,
          course: formattedRequest.courseName,
          issueDate: formattedRequest.issueDate,
          expiryDate: formattedRequest.expiryDate
        },
        fontCache,
        FIELD_CONFIGS
      );

      // Create certificate record
      const verificationCode = this.generateVerificationCode();
      
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          recipient_name: formattedRequest.recipientName,
          recipient_email: formattedRequest.recipientEmail,
          course_name: formattedRequest.courseName,
          location_id: formattedRequest.locationId,
          issue_date: formattedRequest.issueDate,
          expiry_date: formattedRequest.expiryDate,
          verification_code: verificationCode,
          instructor_name: formattedRequest.instructorName,
          roster_id: formattedRequest.rosterId,
          batch_id: formattedRequest.batchId,
          issued_by: options.userId,
          status: 'ACTIVE',
          generation_status: 'COMPLETED'
        })
        .select()
        .single();

      if (certError) {
        throw new Error(`Failed to create certificate record: ${certError.message}`);
      }

      // Upload PDF to storage
      const fileName = `certificate_${certificate.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certification-pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);

      // Update certificate with PDF URL
      const { error: updateError } = await supabase
        .from('certificates')
        .update({ certificate_url: publicUrlData.publicUrl })
        .eq('id', certificate.id);

      if (updateError) {
        throw new Error(`Failed to update certificate URL: ${updateError.message}`);
      }

      // Log audit entry
      await AuditLogService.logAction({
        action: 'CERTIFICATE_GENERATED',
        entity_type: 'certificate',
        entity_id: certificate.id,
        details: {
          recipient_name: formattedRequest.recipientName,
          course_name: formattedRequest.courseName,
          verification_code: verificationCode
        }
      });

      // Send email notification if requested
      if (options.sendEmail && formattedRequest.recipientEmail) {
        await this.sendCertificateEmail(certificate, publicUrlData.publicUrl);
      }

      console.log('Certificate generated successfully:', certificate.id);

      return {
        certificateId: certificate.id,
        pdfUrl: publicUrlData.publicUrl
      };

    } catch (error) {
      console.error('Certificate generation failed:', error);
      
      // Log audit entry for failure
      await AuditLogService.logAction({
        action: 'CERTIFICATE_GENERATION_FAILED',
        entity_type: 'certificate',
        details: {
          recipient_name: request.recipientName,
          course_name: request.courseName,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  static async verifyCertificate(verificationCode: string): Promise<CertificateVerificationResult> {
    try {
      console.log('Verifying certificate with code:', verificationCode);

      // Clean and validate the verification code
      const cleanCode = verificationCode.replace(/\s/g, '').toUpperCase();
      
      if (cleanCode.length !== 10) {
        return {
          valid: false,
          certificate: null,
          status: 'INVALID_FORMAT'
        };
      }

      // Query the certificate with location data
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select(`
          *,
          location:locations(
            name,
            address,
            city,
            state,
            phone,
            email,
            website
          )
        `)
        .eq('verification_code', cleanCode)
        .single();

      if (error || !certificate) {
        console.log('Certificate not found:', error?.message);
        return {
          valid: false,
          certificate: null,
          status: 'NOT_FOUND'
        };
      }

      // Check certificate status and expiry
      let status = 'VALID';
      const currentDate = new Date();
      const expiryDate = new Date(certificate.expiry_date);
      
      if (certificate.status === 'REVOKED') {
        status = 'REVOKED';
      } else if (expiryDate < currentDate) {
        status = 'EXPIRED';
      } else if (certificate.status === 'ACTIVE') {
        status = 'ACTIVE';
      }

      // Log verification attempt
      await AuditLogService.logAction({
        action: 'CERTIFICATE_VERIFIED',
        entity_type: 'certificate',
        entity_id: certificate.id,
        details: {
          verification_code: cleanCode,
          status: status,
          recipient_name: certificate.recipient_name
        }
      });

      return {
        valid: status === 'ACTIVE' || status === 'VALID',
        certificate,
        status
      };

    } catch (error) {
      console.error('Certificate verification failed:', error);
      
      await AuditLogService.logAction({
        action: 'CERTIFICATE_VERIFICATION_FAILED',
        entity_type: 'certificate',
        details: {
          verification_code: verificationCode,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        valid: false,
        certificate: null,
        status: 'ERROR'
      };
    }
  }

  private static async getTemplateUrl(templateId?: string, locationId?: string): Promise<string> {
    if (templateId) {
      const { data } = await supabase
        .from('certificate_templates')
        .select('url')
        .eq('id', templateId)
        .single();
      
      if (data?.url) return data.url;
    }

    if (locationId) {
      const { data } = await supabase
        .from('location_templates')
        .select('template:certificate_templates(url)')
        .eq('location_id', locationId)
        .eq('is_primary', true)
        .single();
      
      if (data?.template?.url) return data.template.url;
    }

    // Fallback to default template
    const { data } = await supabase
      .from('certificate_templates')
      .select('url')
      .eq('is_default', true)
      .single();
    
    if (!data?.url) {
      throw new Error('No certificate template found');
    }

    return data.url;
  }

  private static formatDate(dateString: string): string {
    if (dateString.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
      return dateString; // Already formatted
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
  }

  private static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code = '';
    
    // Generate first 3 characters (letters)
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Generate middle 5 characters (numbers)
    for (let i = 0; i < 5; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate last 2 characters (letters)
    for (let i = 0; i < 2; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  private static async sendCertificateEmail(certificate: any, pdfUrl: string): Promise<void> {
    try {
      // Get location-specific email template
      const { data: emailTemplate } = await supabase
        .from('location_email_templates')
        .select('*')
        .eq('location_id', certificate.location_id)
        .eq('is_default', true)
        .single();

      // Get location data for template variables
      const { data: location } = await supabase
        .from('locations')
        .select('name, address, city, state, phone, email, website')
        .eq('id', certificate.location_id)
        .single();

      // Prepare template variables including verification portal URL
      const templateVariables = {
        recipient_name: certificate.recipient_name,
        course_name: certificate.course_name,
        verification_code: certificate.verification_code,
        certificate_url: pdfUrl,
        location_name: location?.name || 'Assured Response Training',
        verification_portal_url: `${window.location.origin}/verify`,
        issue_date: certificate.issue_date,
        expiry_date: certificate.expiry_date,
        instructor_name: certificate.instructor_name
      };

      // Send email via edge function with template support
      await supabase.functions.invoke('send-certificate-email', {
        body: {
          recipientEmail: certificate.recipient_email,
          recipientName: certificate.recipient_name,
          courseName: certificate.course_name,
          certificateUrl: pdfUrl,
          verificationCode: certificate.verification_code,
          templateId: emailTemplate?.id,
          templateVariables,
          locationId: certificate.location_id
        }
      });

      // Also create notification
      await NotificationProcessor.createNotification({
        userId: certificate.issued_by,
        title: 'Certificate Email Sent',
        message: `Certificate email with verification code ${certificate.verification_code} sent to ${certificate.recipient_name}`,
        type: 'SUCCESS',
        category: 'CERTIFICATE',
        priority: 'NORMAL',
        sendEmail: false,
        metadata: {
          certificate_id: certificate.id,
          verification_code: certificate.verification_code,
          pdf_url: pdfUrl
        }
      });

    } catch (error) {
      console.error('Failed to send certificate email:', error);
    }
  }

  static async bulkGenerateCertificates(
    requests: CertificateGenerationRequest[],
    fontCache: FontCache,
    options: {
      batchName?: string;
      sendEmails?: boolean;
      templateId?: string;
      userId?: string;
    } = {}
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const result = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Create batch record if batch name provided
    let batchId: string | undefined;
    if (options.batchName) {
      const { data: batch, error } = await supabase
        .from('email_batch_operations')
        .insert({
          batch_name: options.batchName,
          total_certificates: requests.length,
          user_id: options.userId,
          status: 'IN_PROGRESS'
        })
        .select()
        .single();

      if (!error && batch) {
        batchId = batch.id;
      }
    }

    // Process certificates in batches of 5 to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (request) => {
          try {
            await this.generateCertificate(
              { ...request, batchId },
              fontCache,
              {
                sendEmail: options.sendEmails,
                templateId: options.templateId,
                userId: options.userId
              }
            );
            result.successful++;
          } catch (error) {
            result.failed++;
            result.errors.push(`${request.recipientName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
    }

    // Update batch status
    if (batchId) {
      await supabase
        .from('email_batch_operations')
        .update({
          status: 'COMPLETED',
          successful_emails: result.successful,
          failed_emails: result.failed,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);
    }

    return result;
  }
}
