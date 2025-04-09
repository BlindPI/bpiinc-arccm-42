
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
        // Use fetch for RPC call instead of direct supabase.rpc
        await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/log_certificate_verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify({
            cert_id: null,
            verification_code_text: code,
            result_status: 'INVALID',
            reason_text: 'Certificate not found'
          })
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
    
    // Log verification attempt using fetch for RPC
    try {
      await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/log_certificate_verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          cert_id: certificate.id,
          verification_code_text: code,
          result_status: status,
          reason_text: valid ? null : `Certificate status: ${status}`
        })
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
    
    // Log the revocation action using fetch for RPC
    try {
      await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/log_certificate_action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          certificate_id: certificateId,
          action_type: 'REVOKED',
          reason_text: reason,
          user_id: userId
        })
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

// Add missing functions referenced in useCertificateRequest.ts
export async function createCertificate(request: any, issuerId: string, requestId: string): Promise<any> {
  try {
    // Generate a verification code for the certificate
    const verificationCode = generateVerificationCode();
    
    // Create the certificate record
    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        recipient_name: request.recipient_name,
        course_name: request.course_name,
        issue_date: request.issue_date,
        expiry_date: request.expiry_date,
        verification_code: verificationCode,
        issued_by: issuerId,
        certificate_request_id: requestId,
        status: 'ACTIVE'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }
}

export async function generateAndUploadCertificatePDF(certificate: any, request: any, fontCache?: any): Promise<void> {
  // This is a placeholder implementation
  console.log('Generating PDF for certificate:', certificate.id);
  
  try {
    // Update the certificate with the URL to the generated PDF
    const { error } = await supabase
      .from('certificates')
      .update({
        certificate_url: `https://example.com/certificates/${certificate.id}.pdf`
      })
      .eq('id', certificate.id);
    
    if (error) throw error;
    
    console.log('Certificate PDF URL updated successfully');
  } catch (error) {
    console.error('Error updating certificate with PDF URL:', error);
    throw error;
  }
}

// Helper function to generate a random verification code
function generateVerificationCode(): string {
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
