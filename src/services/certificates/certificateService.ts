
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { toast } from 'sonner';
import { getDefaultTemplate } from './templateService';

export const createCertificate = async (request: any, profileId: string, requestId: string) => {
  try {
    const issueDate = new Date(request.issue_date);
    const expiryDate = new Date(request.expiry_date);
    
    const formattedIssueDate = format(issueDate, 'yyyy-MM-dd');
    const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');

    // Create verification code (alphanumeric mix with built-in verification pattern)
    const verificationCode = generateVerificationCode();

    // Create certificate record
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        recipient_name: request.recipient_name,
        course_name: request.course_name,
        issue_date: formattedIssueDate,
        expiry_date: formattedExpiryDate,
        issued_by: profileId,
        status: 'ACTIVE',
        certificate_request_id: requestId,
        verification_code: verificationCode
      })
      .select()
      .single();

    if (certError) throw certError;
    if (!certificate) throw new Error('Certificate created but no data returned');

    return certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }
};

// Generate a verification code with built-in validation pattern
const generateVerificationCode = () => {
  // Format: 3 letters + 5 numbers + 2 letters
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing letters I, O
  const numbers = '0123456789';
  
  let code = '';
  
  // First part: 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Middle part: 5 numbers
  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  // Last part: 2 letters
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  return code;
};

export const generateAndUploadCertificatePDF = async (
  certificate: any,
  request: any,
  fontCache: Record<string, ArrayBuffer>
) => {
  try {
    const issueDate = new Date(request.issue_date);
    const expiryDate = new Date(request.expiry_date);

    // Get the default template URL
    const template = await getDefaultTemplate();
    if (!template) throw new Error('No certificate template found');
    
    const templateUrl = template.url;

    const pdfBytes = await generateCertificatePDF(
      templateUrl,
      {
        name: request.recipient_name,
        course: request.course_name,
        issueDate: format(issueDate, 'MMMM d, yyyy'),
        expiryDate: format(expiryDate, 'MMMM d, yyyy')
      },
      fontCache,
      FIELD_CONFIGS
    );

    const fileName = `${certificate.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('certification-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('certification-pdfs')
      .getPublicUrl(fileName);

    const { error: urlUpdateError } = await supabase
      .from('certificates')
      .update({
        certificate_url: publicUrl,
        template_id: template.id
      })
      .eq('id', certificate.id);

    if (urlUpdateError) throw urlUpdateError;

    // Create a notification for the certificate generation
    await createCertificateNotification(request.user_id, certificate, request.course_name);

    // Log certificate creation audit
    await logCertificateAction(certificate.id, 'ISSUE', null, certificate.issued_by);

    return publicUrl;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

export const createCertificateNotification = async (userId: string, certificate: any, courseName: string) => {
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'SUCCESS',
        title: 'Certificate Generated',
        message: `Your certificate for ${courseName} has been generated.`,
        action_url: `${window.location.origin}/certificates/${certificate.id}`,
        read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      toast.error('Could not create notification for certificate');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getCertificateById = async (certificateId: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw error;
  }
};

export const revokeCertificate = async (certificateId: string, reason: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .update({ 
        status: 'REVOKED',
        updated_at: new Date().toISOString()
      })
      .eq('id', certificateId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log revocation action
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await logCertificateAction(certificateId, 'REVOKE', reason, userId);
    
    return data;
  } catch (error) {
    console.error('Error revoking certificate:', error);
    throw error;
  }
};

// Log certificate action to audit trail
const logCertificateAction = async (certificateId: string, action: 'ISSUE' | 'REVOKE' | 'UPDATE', reason: string | null, userId: string | null) => {
  try {
    await supabase.rpc('log_certificate_action', {
      certificate_id: certificateId,
      action_type: action,
      reason_text: reason,
      user_id: userId
    });
  } catch (error) {
    console.error('Error logging certificate action:', error);
    // Don't throw - this should not block the main operation
  }
};

export const verifyCertificate = async (verificationCode: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('verification_code', verificationCode)
      .single();
    
    if (error) throw error;
    
    // Check if expired
    const expiryDate = new Date(data.expiry_date);
    const isExpired = expiryDate < new Date();
    
    if (isExpired && data.status === 'ACTIVE') {
      // Update to expired
      await supabase
        .from('certificates')
        .update({ status: 'EXPIRED' })
        .eq('id', data.id);
        
      data.status = 'EXPIRED';
    }
    
    const isValid = data.status === 'ACTIVE';
    
    // Log verification attempt
    await logVerificationAttempt(data.id, verificationCode, isValid ? 'SUCCESS' : 'FAILED', 
      !isValid ? (data.status === 'EXPIRED' ? 'EXPIRED' : 'REVOKED') : null);
    
    return { 
      valid: isValid, 
      certificate: data,
      status: data.status
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    
    // Log failed verification attempt
    await logVerificationAttempt(null, verificationCode, 'FAILED', 'NOT_FOUND');
    
    return { valid: false, certificate: null };
  }
};

// Log verification attempt
const logVerificationAttempt = async (
  certificateId: string | null, 
  verificationCode: string, 
  result: 'SUCCESS' | 'FAILED', 
  reason: string | null
) => {
  try {
    await supabase.rpc('log_certificate_verification', {
      cert_id: certificateId,
      verification_code_text: verificationCode,
      result_status: result,
      reason_text: reason
    });
  } catch (error) {
    console.error('Error logging verification attempt:', error);
    // Don't throw - this should not block the main operation
  }
};
