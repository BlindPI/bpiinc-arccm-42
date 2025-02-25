
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const createCertificate = async (request: any, profileId: string, requestId: string) => {
  const issueDate = new Date(request.issue_date);
  const expiryDate = new Date(request.expiry_date);
  
  const formattedIssueDate = format(issueDate, 'yyyy-MM-dd');
  const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');

  const { data: certificate, error: certError } = await supabase
    .from('certificates')
    .insert([{
      recipient_name: request.recipient_name,
      email: request.email,
      course_name: request.course_name,
      issue_date: formattedIssueDate,
      expiry_date: formattedExpiryDate,
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
