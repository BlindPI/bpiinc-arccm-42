
import { supabase } from '@/integrations/supabase/client';
import { FontCache } from '@/hooks/useFontLoader';
import { FIELD_CONFIGS } from '@/types/certificate';
import { PDFDocument } from 'pdf-lib';
import { generateCertificatePDF } from '@/utils/pdfUtils';

export interface CertificateVerificationResult {
  valid: boolean;
  certificate: any;
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
        const { error: logError } = await supabase
          .from('certificate_verification_logs')
          .insert({
            verification_code: code,
            certificate_id: null,
            result: 'INVALID',
            reason: 'Certificate not found'
          });
          
        if (logError) console.error('Error logging verification:', logError);
      } catch (logError) {
        console.error('Error logging verification:', logError);
      }
      
      return {
        valid: false,
        certificate: null,
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
      const { error: logError } = await supabase
        .from('certificate_verification_logs')
        .insert({
          certificate_id: certificate.id,
          verification_code: code,
          result: status,
          reason: valid ? null : `Certificate status: ${status}`
        });
        
      if (logError) console.error('Error logging verification:', logError);
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
      certificate: null,
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
      const { error: logError } = await supabase
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificateId,
          action: 'REVOKED',
          performed_by: userId,
          reason
        });
        
      if (logError) console.error('Error logging certificate action:', logError);
    } catch (logError) {
      console.error('Error logging certificate action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return false;
  }
}

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
    
    // Log the certificate creation
    try {
      const { error: logError } = await supabase
        .from('certificate_audit_logs')
        .insert({
          certificate_id: certificate.id,
          action: 'CREATED',
          performed_by: issuerId,
        });
        
      if (logError) console.error('Error logging certificate creation:', logError);
    } catch (logError) {
      console.error('Error logging certificate creation:', logError);
    }
    
    return certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }
}

export async function generateAndUploadCertificatePDF(certificate: any, request: any, fontCache: FontCache): Promise<void> {
  try {
    console.log('Generating PDF for certificate:', certificate.id);
    
    // Get the default template
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (templateError) {
      // If no default template found, try to get the most recent one
      const { data: recentTemplate, error: recentError } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (recentError || !recentTemplate) {
        throw new Error('No certificate template available');
      }
      
      // Use the most recent template
      const templateUrl = recentTemplate.url;
      await generateAndUploadPDF(certificate, templateUrl, fontCache);
    } else {
      // Use the default template
      const templateUrl = template.url;
      await generateAndUploadPDF(certificate, templateUrl, fontCache);
    }
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
}

async function generateAndUploadPDF(certificate: any, templateUrl: string, fontCache: FontCache): Promise<void> {
  try {
    // Generate the PDF
    const pdfBytes = await generateCertificatePDF(
      templateUrl,
      {
        name: certificate.recipient_name,
        course: certificate.course_name,
        issueDate: certificate.issue_date,
        expiryDate: certificate.expiry_date
      },
      fontCache,
      FIELD_CONFIGS
    );
    
    // Prepare the PDF file for upload
    const pdfFileName = `certificate_${certificate.id}.pdf`;
    
    // Upload the PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certification-pdfs')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Update the certificate with the URL to the generated PDF
    const { data: publicUrlData } = supabase.storage
      .from('certification-pdfs')
      .getPublicUrl(pdfFileName);
    
    if (!publicUrlData) throw new Error('Failed to get public URL');
    
    // Update the certificate with the PDF URL
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        certificate_url: publicUrlData.publicUrl
      })
      .eq('id', certificate.id);
    
    if (updateError) throw updateError;
    
    console.log('Certificate PDF generated and URL updated successfully');
  } catch (error) {
    console.error('Error in PDF generation and upload:', error);
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
