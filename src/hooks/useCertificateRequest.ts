
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UpdateRequestParams } from '@/types/certificates';
import { sendCertificateNotification } from '@/services/notifications/certificateNotifications';

export const useCertificateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason,
      profile
    }: UpdateRequestParams) => {
      console.log('Starting certificate request process:', { id, status });

      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      // Check if user has admin role
      if (!['SA', 'AD'].includes(profile.role)) {
        console.error('Insufficient permissions to update request:', profile.role);
        throw new Error('Only administrators can approve or reject certificate requests');
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

      console.log('Found request data:', request);

      // Direct archiving for failed assessments or archived statuses
      if (status === 'ARCHIVE_FAILED' || status === 'ARCHIVED') {
        console.log(`Archiving request ${id} with status ${status}`);
        
        const { error: archiveError } = await supabase
          .from('certificate_requests')
          .update({ 
            status: 'ARCHIVED',
            reviewer_id: profile.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (archiveError) {
          console.error('Error archiving request:', archiveError);
          throw archiveError;
        }
        
        console.log('Request archived successfully');
        queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
        queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
        
        return { status: 'archived' };
      }

      // Prevent processing failed assessments - using array includes method to avoid TypeScript errors
      if (request.assessment_status === 'FAIL' && !['ARCHIVED', 'ARCHIVE_FAILED'].includes(status)) {
        console.error('Cannot process failed assessment:', id);
        throw new Error('Cannot process failed assessment requests');
      }

      // Update the request status - for approvals, set to PROCESSING first
      // Rejections should set status to REJECTED, not ARCHIVED
      const newStatus = status === 'APPROVED' ? 'PROCESSING' : status;
      
      // Update without the reviewer relationship to avoid foreign key issues
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status: newStatus, 
          rejection_reason: rejectionReason,
          reviewer_id: profile.id,
          updated_at: new Date().toISOString() // Add updated timestamp
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      console.log(`Successfully updated request ${id} to status ${newStatus}`);

      // Format dates consistently to Month day, year format
      const formatDate = (dateStr: string): string => {
        try {
          if (dateStr.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
            return dateStr;  // Already formatted correctly
          }
          
          let date;
          if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            date = new Date(dateStr);
          }
          
          if (isNaN(date.getTime())) {
            return dateStr;  // Return original if parsing failed
          }
          
          const month = date.toLocaleString('en-US', { month: 'long' });
          const day = date.getDate();
          const year = date.getFullYear();
          return `${month} ${day}, ${year}`;
        } catch (error) {
          console.error('Date formatting error:', error);
          return dateStr;
        }
      };
      
      const formattedIssueDate = formatDate(request.issue_date);
      const formattedExpiryDate = formatDate(request.expiry_date);

      // Send notification
      await sendCertificateNotification({
        recipientEmail: request.email,
        recipientName: request.recipient_name,
        message: status === 'APPROVED' 
          ? `Your certificate request for ${request.course_name} is being processed.` 
          : `Your certificate request for ${request.course_name} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        type: status === 'APPROVED' ? 'CERTIFICATE_APPROVED' : 'CERTIFICATE_REJECTED',
        courseName: request.course_name,
        rejectionReason,
        sendEmail: true
      });

      // If approved, call the edge function to generate the certificate in the background
      if (status === 'APPROVED') {
        try {
          console.log('Calling edge function to generate certificate');
          
          supabase.functions
            .invoke('generate-certificate', {
              body: { 
                requestId: id,
                issuerId: profile.id
              }
            })
            .then(({ data: generateResult, error: generateError }) => {
              if (generateError) {
                console.error('Error calling generate-certificate function:', generateError);
                toast.error('Certificate generation failed. Please try again.');
                return;
              }
              
              console.log('Certificate generation response:', generateResult);
              
              if (!generateResult || !generateResult.success) {
                const errorMessage = generateResult?.error || 'Unknown error';
                console.error('Certificate generation failed:', errorMessage);
                toast.error(`Certificate generation failed: ${errorMessage}`);
                return;
              }
              
              console.log('Certificate generated successfully:', generateResult);
              toast.success('Certificate generated successfully');
              
              // Force a refresh of the certificates data
              queryClient.invalidateQueries({ queryKey: ['certificates'] });
              
              // Also refresh archived requests
              queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
            });

          return { status: 'processing' };
        } catch (error) {
          console.error('Error in certificate creation process:', error);
          throw new Error('Failed to create certificate: ' + (error as Error).message);
        }
      } else if (status === 'REJECTED') {
        // If rejected, update to ARCHIVED after notification is sent
        try {
          console.log('Archiving rejected request:', id);
          const { error: archiveError } = await supabase
            .from('certificate_requests')
            .update({ 
              status: 'ARCHIVED',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
          if (archiveError) {
            console.error('Error archiving rejected request:', archiveError);
          } else {
            console.log('Rejected request archived successfully');
            
            // Refresh archived requests
            queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
          }
        } catch (archiveError) {
          console.error('Error archiving rejected request:', archiveError);
          // Don't throw, just log - we want the rejection to succeed even if archiving fails
        }
      }
    },
    onSuccess: () => {
      // Always invalidate both certificate requests and certificates queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate_requests_archived'] });
      toast.success('Request updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating request:', error);
      toast.error(`Failed to update request: ${error.message}`);
    },
  });
};
