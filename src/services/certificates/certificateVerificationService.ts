
import { supabase } from '@/integrations/supabase/client';

export interface VerificationResult {
  valid: boolean;
  certificate?: {
    id: string;
    recipient_name: string;
    course_name: string;
    issue_date: string;
    expiry_date: string;
    status: string;
    verification_code: string;
  };
  status: string;
  error?: string;
  rateLimited?: boolean;
}

export class CertificateVerificationService {
  static async verifyCertificate(verificationCode: string): Promise<VerificationResult> {
    try {
      // Get client IP for rate limiting (simplified for frontend)
      const clientIP = '127.0.0.1'; // In production, this would come from request headers
      
      // Check rate limit
      const { data: rateLimitResult, error: rateLimitError } = await supabase
        .rpc('check_verification_rate_limit', { client_ip: clientIP });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        // Continue with verification even if rate limiting fails
      } else if (!rateLimitResult) {
        return {
          valid: false,
          status: 'RATE_LIMITED',
          error: 'Too many verification attempts. Please try again later.',
          rateLimited: true
        };
      }

      // Call the existing verification function
      const { data, error } = await supabase
        .rpc('verify_certificate', { verification_code: verificationCode });

      if (error) {
        console.error('Certificate verification error:', error);
        return {
          valid: false,
          status: 'ERROR',
          error: 'Unable to verify certificate. Please check the verification code and try again.'
        };
      }

      if (!data || data.length === 0) {
        return {
          valid: false,
          status: 'NOT_FOUND',
          error: 'Certificate not found. Please check the verification code.'
        };
      }

      const certificate = data[0];

      return {
        valid: certificate.valid,
        status: certificate.valid ? 'VALID' : 'INVALID',
        certificate: certificate.valid ? {
          id: certificate.certificate_id,
          recipient_name: certificate.recipient_name,
          course_name: certificate.course_name,
          issue_date: certificate.issue_date,
          expiry_date: certificate.expiry_date,
          status: certificate.status,
          verification_code: verificationCode
        } : undefined,
        error: !certificate.valid ? 'Certificate is not valid or has been revoked.' : undefined
      };
    } catch (error) {
      console.error('Verification service error:', error);
      return {
        valid: false,
        status: 'ERROR',
        error: 'An unexpected error occurred during verification. Please try again.'
      };
    }
  }

  static async logVerificationAttempt(
    verificationCode: string, 
    result: 'FOUND' | 'NOT_FOUND' | 'RATE_LIMITED',
    certificateId?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_certificate_verification', {
        cert_id: certificateId || null,
        verification_code_text: verificationCode,
        result_status: result,
        reason_text: null
      });
    } catch (error) {
      console.error('Failed to log verification attempt:', error);
    }
  }
}
