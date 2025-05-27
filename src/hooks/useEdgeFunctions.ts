
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EdgeFunctionService } from '@/services/edgeFunctions/edgeFunctionService';
import { toast } from 'sonner';

export function useEdgeFunctions() {
  const queryClient = useQueryClient();

  const processNotifications = useMutation({
    mutationFn: () => EdgeFunctionService.processNotificationQueue(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Notification queue processed successfully');
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else {
        toast.error(`Failed to process notifications: ${result.error}`);
      }
    },
    onError: (error: any) => {
      toast.error(`Notification processing failed: ${error.message}`);
    }
  });

  const sendCertificateEmail = useMutation({
    mutationFn: (certificateId: string) => EdgeFunctionService.sendCertificateEmail(certificateId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Certificate email sent successfully');
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
      } else {
        toast.error(`Failed to send email: ${result.error}`);
      }
    }
  });

  const generateCertificate = useMutation({
    mutationFn: (requestId: string) => EdgeFunctionService.generateCertificate(requestId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Certificate generated successfully');
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        queryClient.invalidateQueries({ queryKey: ['certificate-requests'] });
      } else {
        toast.error(`Failed to generate certificate: ${result.error}`);
      }
    }
  });

  const sendBatchEmails = useMutation({
    mutationFn: (batchId: string) => EdgeFunctionService.sendBatchEmails(batchId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Batch emails sent successfully');
        queryClient.invalidateQueries({ queryKey: ['email-batches'] });
      } else {
        toast.error(`Failed to send batch emails: ${result.error}`);
      }
    }
  });

  const createUser = useMutation({
    mutationFn: (userData: any) => EdgeFunctionService.createUser(userData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('User created successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(`Failed to create user: ${result.error}`);
      }
    }
  });

  const sendInvitation = useMutation({
    mutationFn: (invitationData: any) => EdgeFunctionService.sendInvitation(invitationData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Invitation sent successfully');
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
      } else {
        toast.error(`Failed to send invitation: ${result.error}`);
      }
    }
  });

  return {
    processNotifications,
    sendCertificateEmail,
    generateCertificate,
    sendBatchEmails,
    createUser,
    sendInvitation
  };
}
