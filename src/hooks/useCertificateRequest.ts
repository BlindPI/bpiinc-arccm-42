
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UpdateRequestParams } from '@/types/certificates';
import { sendCertificateNotification } from '@/services/notifications/certificateNotifications';
import { createCertificate, generateAndUploadCertificatePDF } from '@/services/certificates/certificateService';

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
      console.log('Starting certificate request process:', { id, status });

      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      // First fetch the request details
      console.log('Fetching request details for ID:', id);
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (requestError || !request) {
        console.error('Error fetching request:', requestError);
        throw new Error('Request not found');
      }

      console.log('Found request data:', request);

      // Update the request status
      console.log('Updating request status to:', status);
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

      // Send notification
      await sendCertificateNotification({
        recipientEmail: request.email,
        recipientName: request.recipient_name,
        message: status === 'APPROVED' 
          ? `Your certificate request for ${request.course_name} has been approved.` 
          : `Your certificate request for ${request.course_name} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        type: status === 'APPROVED' ? 'CERTIFICATE_APPROVED' : 'CERTIFICATE_REJECTED',
        courseName: request.course_name,
        rejectionReason,
        sendEmail: true
      });

      // If approved, generate and create certificate
      if (status === 'APPROVED') {
        try {
          console.log('Starting certificate creation process');
          
          const certificate = await createCertificate(request, profile.id, id);
          console.log('Certificate created successfully:', certificate);

          console.log('Generating PDF for certificate:', certificate.id);
          await generateAndUploadCertificatePDF(certificate, request, fontCache);
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
