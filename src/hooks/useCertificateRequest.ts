
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';

interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  profile: any;
  fontCache: Record<string, ArrayBuffer>;
}

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
      const { data: request } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!request) throw new Error('Request not found');

      // Update the request status
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status, 
          rejection_reason: rejectionReason,
          reviewer_id: profile?.id 
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // If approved, generate and create certificate
      if (status === 'APPROVED') {
        try {
          // Create certificate record
          const { data: certificate, error: certError } = await supabase
            .from('certificates')
            .insert({
              certificate_request_id: id,
              recipient_name: request.recipient_name,
              course_name: request.course_name,
              issue_date: request.issue_date,
              expiry_date: request.expiry_date,
              email: request.email,
              phone: request.phone,
              company: request.company,
              first_aid_level: request.first_aid_level,
              cpr_level: request.cpr_level,
              assessment_status: request.assessment_status,
              issued_by: profile?.id,
              status: 'ACTIVE'
            })
            .select()
            .single();

          if (certError) throw certError;

          const templateUrl = 'https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf';
          const pdfBytes = await generateCertificatePDF(
            templateUrl,
            {
              name: request.recipient_name,
              course: request.course_name,
              issueDate: request.issue_date,
              expiryDate: request.expiry_date
            },
            fontCache,
            FIELD_CONFIGS
          );

          // Upload generated PDF
          const { error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(`${certificate.id}.pdf`, pdfBytes);

          if (uploadError) throw uploadError;

          // Update certificate with URL
          const { error: urlUpdateError } = await supabase
            .from('certificates')
            .update({
              certificate_url: `${certificate.id}.pdf`
            })
            .eq('id', certificate.id);

          if (urlUpdateError) throw urlUpdateError;
        } catch (error) {
          console.error('Error creating certificate:', error);
          throw new Error('Failed to create certificate');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Request updated successfully');
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    },
  });
};
