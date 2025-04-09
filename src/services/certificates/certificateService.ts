
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { toast } from 'sonner';

export const CERTIFICATE_TEMPLATE_URL = 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';

export const createCertificate = async (request: any, profileId: string, requestId: string) => {
  try {
    const issueDate = new Date(request.issue_date);
    const expiryDate = new Date(request.expiry_date);
    
    const formattedIssueDate = format(issueDate, 'yyyy-MM-dd');
    const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');

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
        verification_code: Math.random().toString(36).substring(2, 15)
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

export const generateAndUploadCertificatePDF = async (
  certificate: any,
  request: any,
  fontCache: Record<string, ArrayBuffer>
) => {
  try {
    const issueDate = new Date(request.issue_date);
    const expiryDate = new Date(request.expiry_date);

    const pdfBytes = await generateCertificatePDF(
      CERTIFICATE_TEMPLATE_URL,
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
        certificate_url: publicUrl
      })
      .eq('id', certificate.id);

    if (urlUpdateError) throw urlUpdateError;

    // Create a notification for the certificate generation
    await createCertificateNotification(request.user_id, certificate, request.course_name);

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

export const verifyCertificate = async (verificationCode: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('verification_code', verificationCode)
      .eq('status', 'ACTIVE')
      .single();
    
    if (error) throw error;
    return { valid: true, certificate: data };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return { valid: false, certificate: null };
  }
};
