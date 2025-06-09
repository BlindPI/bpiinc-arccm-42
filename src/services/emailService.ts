
import { supabase } from '@/integrations/supabase/client';
import { EmailBatchOperation } from '@/types/certificates';

export interface BatchEmailRequest {
  certificateIds: string[];
  customMessage?: string;
  batchName: string;
}

export interface SingleEmailRequest {
  certificateId: string;
  recipientEmail: string;
  message?: string;
}

export class EmailService {
  static async sendBatchCertificateEmails(request: BatchEmailRequest): Promise<{ batchId: string }> {
    try {
      // Create batch operation record
      const { data: batchOp, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          batch_name: request.batchName,
          total_certificates: request.certificateIds.length,
          processed_certificates: 0,
          successful_emails: 0,
          failed_emails: 0,
          status: 'PENDING'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // In a real implementation, this would trigger the actual email sending
      // For now, we'll simulate the process
      setTimeout(async () => {
        await this.processBatchEmails(batchOp.id, request.certificateIds);
      }, 1000);

      return { batchId: batchOp.id };
    } catch (error) {
      console.error('Error initiating batch email:', error);
      throw error;
    }
  }

  static async sendSingleCertificateEmail(request: SingleEmailRequest): Promise<void> {
    try {
      // Call the edge function or email service
      const { error } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          certificateId: request.certificateId,
          recipientEmail: request.recipientEmail,
          message: request.message
        }
      });

      if (error) throw error;

      // Update certificate email status
      await supabase
        .from('certificates')
        .update({
          email_status: 'sent',
          last_emailed_at: new Date().toISOString()
        })
        .eq('id', request.certificateId);

    } catch (error) {
      console.error('Error sending single certificate email:', error);
      throw error;
    }
  }

  private static async processBatchEmails(batchId: string, certificateIds: string[]): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('email_batch_operations')
        .update({ status: 'PROCESSING' })
        .eq('id', batchId);

      let successful = 0;
      let failed = 0;

      // Process each certificate
      for (let i = 0; i < certificateIds.length; i++) {
        try {
          // Simulate email sending delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In real implementation, send actual email here
          successful++;
        } catch (error) {
          failed++;
        }

        // Update progress
        await supabase
          .from('email_batch_operations')
          .update({
            processed_certificates: i + 1,
            successful_emails: successful,
            failed_emails: failed
          })
          .eq('id', batchId);
      }

      // Mark as completed
      await supabase
        .from('email_batch_operations')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

    } catch (error) {
      console.error('Error processing batch emails:', error);
      await supabase
        .from('email_batch_operations')
        .update({
          status: 'FAILED',
          error_message: error.message
        })
        .eq('id', batchId);
    }
  }

  static async getBatchOperation(batchId: string): Promise<EmailBatchOperation | null> {
    try {
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching batch operation:', error);
      return null;
    }
  }
}
