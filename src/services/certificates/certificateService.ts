
import { supabase } from '@/integrations/supabase/client';

export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: any;
  status: string;
}

export async function verifyCertificate(code: string): Promise<CertificateVerificationResult> {
  try {
    // Check if code exists
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('verification_code', code)
      .single();
    
    if (error) {
      // Log verification attempt as failed
      try {
        await supabase.rpc('log_certificate_verification', {
          cert_id: null,
          verification_code_text: code,
          result_status: 'INVALID',
          reason_text: 'Certificate not found'
        });
      } catch (logError) {
        console.error('Error logging verification:', logError);
      }
      
      return {
        valid: false,
        status: 'INVALID'
      };
    }
    
    // Check certificate status
    let status = 'VALID';
    let valid = true;
    
    if (certificate.status !== 'ACTIVE') {
      status = certificate.status;
      valid = false;
    } else {
      // Check if expired
      const expiryDate = new Date(certificate.expiry_date);
      if (expiryDate < new Date()) {
        status = 'EXPIRED';
        valid = false;
      }
    }
    
    // Log verification attempt
    try {
      await supabase.rpc('log_certificate_verification', {
        cert_id: certificate.id,
        verification_code_text: code,
        result_status: status,
        reason_text: valid ? null : `Certificate status: ${status}`
      });
    } catch (logError) {
      console.error('Error logging verification:', logError);
    }
    
    return {
      valid,
      certificate,
      status
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      valid: false,
      status: 'ERROR'
    };
  }
}

export async function revokeCertificate(certificateId: string, reason: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Update certificate status
    const { error } = await supabase
      .from('certificates')
      .update({ status: 'REVOKED' })
      .eq('id', certificateId);
    
    if (error) throw error;
    
    // Log the revocation action
    try {
      await supabase.rpc('log_certificate_action', {
        certificate_id: certificateId,
        action_type: 'REVOKED',
        reason_text: reason,
        user_id: userId
      });
    } catch (logError) {
      console.error('Error logging certificate action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return false;
  }
}
