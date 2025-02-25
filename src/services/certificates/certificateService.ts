
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';

export const CERTIFICATE_TEMPLATE_URL = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';

export const createCertificate = async (request: any, profileId: string, requestId: string) => {
  const issueDate = new Date(request.issue_date);
  const expiryDate = new Date(request.expiry_date);
  
  const formattedIssueDate = format(issueDate, 'yyyy-MM-dd');
  const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');

  // Create certificate record
  const { data: certificate, error: certError } = await supabase
    .from('certificates')
    .insert([{
      recipient_name: request.recipient_name,
      email: request.email,
      phone: request.phone,
      company: request.company,
      course_name: request.course_name,
      issue_date: formattedIssueDate,
      expiry_date: formattedExpiryDate,
      first_aid_level: request.first_aid_level,
      cpr_level: request.cpr_level,
      assessment_status: request.assessment_status,
      issued_by: profileId,
      status: 'ACTIVE',
      certificate_request_id: requestId
    }])
    .select()
    .single();

  if (certError) throw certError;
  if (!certificate) throw new Error('Certificate created but no data returned');

  return certificate;
};

export const generateAndUploadCertificatePDF = async (
  certificate: any,
  request: any,
  fontCache: Record<string, ArrayBuffer>
) => {
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

  const { error: urlUpdateError } = await supabase
    .from('certificates')
    .update({
      certificate_url: fileName
    })
    .eq('id', certificate.id);

  if (urlUpdateError) throw urlUpdateError;

  return fileName;
};
