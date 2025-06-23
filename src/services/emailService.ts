
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';

export interface SingleEmailParams {
  certificateId: string;
  recipientEmail: string;
  message?: string;
  allowEmailOverride?: boolean;
}

export interface BatchEmailParams {
  certificateIds: string[];
  customMessage?: string;
  batchName?: string;
}

export class EmailService {
  /**
   * Send email for a single certificate using the batch email function
   */
  static async sendSingleCertificateEmail({
    certificateId,
    recipientEmail,
    message,
    allowEmailOverride = false
  }: SingleEmailParams) {
    try {
      console.log('Sending single certificate email via batch function:', {
        certificateId,
        recipientEmail
      });

      // Create a temporary batch operation for single email
      const { data: batchRecord, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          total_certificates: 1,
          batch_name: `Single Email ${new Date().toISOString().slice(0, 10)}`,
          status: 'PENDING'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // For single emails, use the individual email function for better validation
      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          certificateId,
          recipientEmail,
          message,
          allowEmailOverride
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error sending single certificate email:', error);
      throw error;
    }
  }

  /**
   * Send batch emails for multiple certificates
   */
  static async sendBatchCertificateEmails({
    certificateIds,
    customMessage,
    batchName
  }: BatchEmailParams) {
    try {
      console.log('🔧 [EmailService] Starting batch certificate emails:', {
        certificateCount: certificateIds.length,
        batchName
      });

      // Get current user for debugging
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔧 [EmailService] Current user:', {
        userId: user?.id,
        email: user?.email,
        userError: userError?.message
      });

      // Get user profile for debugging
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      console.log('🔧 [EmailService] User profile:', {
        role: profile?.role,
        profileError: profileError?.message
      });

      console.log('🔧 [EmailService] Attempting to create batch operation record...');

      // Create batch operation record
      const { data: batchRecord, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          total_certificates: certificateIds.length,
          batch_name: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`,
          status: 'PENDING'
        })
        .select()
        .single();

      console.log('🔧 [EmailService] Batch operation insert result:', {
        success: !batchError,
        batchRecordId: batchRecord?.id,
        error: batchError
      });

      if (batchError) throw batchError;

      // Call the batch email function
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchRecord.id,
          customMessage
        }
      });

      if (error) throw error;

      return { success: true, batchId: batchRecord.id, data };
    } catch (error) {
      console.error('Error sending batch certificate emails:', error);
      throw error;
    }
  }
}
