
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { format } from 'date-fns';

interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  profile: any;
  fontCache: Record<string, ArrayBuffer>;
}

export const CERTIFICATE_TEMPLATE_URL = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';

export const useCertificateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason,
      profile,
      fontCache
    }: UpdateRequestParams) => {
      console.log('Processing certificate request:', { id, status });

      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      // First fetch the request details
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (requestError || !request) {
        console.error('Error fetching request:', requestError);
        throw new Error('Request not found');
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status, 
          rejection_reason: rejectionReason,
          reviewer_id: profile.id 
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      // If approved, generate and create certificate
      if (status === 'APPROVED') {
        try {
          console.log('Creating certificate record');
          
          // Parse dates to ensure proper format
          const issueDate = new Date(request.issue_date);
          const expiryDate = new Date(request.expiry_date);

          // Format dates properly for Postgres date type
          const formattedIssueDate = format(issueDate, 'yyyy-MM-dd');
          const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');

          // Create certificate record with the user's ID as issued_by
          const { data: certificate, error: certError } = await supabase
            .from('certificates')
            .insert([{  // Note: Wrap in array as per Supabase types
              recipient_name: request.recipient_name,
              course_name: request.course_name,
              issue_date: formattedIssueDate,
              expiry_date: formattedExpiryDate,
              email: request.email,
              phone: request.phone,
              company: request.company,
              first_aid_level: request.first_aid_level,
              cpr_level: request.cpr_level,
              assessment_status: request.assessment_status,
              issued_by: profile.id,
              status: 'ACTIVE',
              certificate_request_id: id
            }])
            .select()
            .single();

          if (certError) {
            console.error('Error creating certificate:', certError);
            throw certError;
          }

          if (!certificate) {
            throw new Error('Certificate created but no data returned');
          }

          console.log('Generating PDF for certificate:', certificate.id);
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

          console.log('Uploading PDF to certification-pdfs bucket');
          const fileName = `${certificate.id}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('certification-pdfs')
            .upload(fileName, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading PDF:', uploadError);
            throw uploadError;
          }

          console.log('PDF uploaded successfully, updating certificate URL');
          const { error: urlUpdateError } = await supabase
            .from('certificates')
            .update({
              certificate_url: fileName
            })
            .eq('id', certificate.id);

          if (urlUpdateError) {
            console.error('Error updating certificate URL:', urlUpdateError);
            throw urlUpdateError;
          }

          console.log('Certificate creation process completed successfully');
        } catch (error) {
          console.error('Error in certificate creation process:', error);
          throw new Error('Failed to create certificate: ' + error.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Request updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating request:', error);
      toast.error(`Failed to update request: ${error.message}`);
    },
  });
};
