import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export function useCertificateOperations() {
  const { data: profile } = useProfile();
  const [deletingCertificateId, setDeletingCertificateId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getDownloadUrl = async (fileName: string) => {
    try {
      if (fileName && (fileName.startsWith('http://') || fileName.startsWith('https://'))) {
        return fileName;
      }
      
      const { data } = await supabase.storage
        .from('certification-pdfs')
        .createSignedUrl(fileName, 60);

      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast.error('Failed to get download URL');
      return null;
    }
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!profile?.role || profile.role !== 'SA') {
      toast.error('Only System Administrators can delete certificates');
      return;
    }

    try {
      setIsDeleting(true);
      
      // First get the certificate to check if there's a related request to update
      const { data: certificate, error: fetchError } = await supabase
        .from('certificates')
        .select('certificate_request_id')
        .eq('id', certificateId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching certificate details:', fetchError);
      } else if (certificate?.certificate_request_id) {
        // Update the related request status if it exists and is archived
        const { error: updateRequestError } = await supabase
          .from('certificate_requests')
          .update({ status: 'DELETED' })
          .eq('id', certificate.certificate_request_id)
          .eq('status', 'ARCHIVED');
          
        if (updateRequestError) {
          console.warn('Could not update related request status:', updateRequestError);
        }
      }
      
      // Delete the certificate
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);

      if (error) throw error;

      toast.success('Certificate deleted successfully');
      setDeletingCertificateId(null);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Failed to delete certificate. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!profile?.role || profile.role !== 'SA') {
      toast.error('Only System Administrators can perform bulk deletion');
      return;
    }

    try {
      setIsDeleting(true);
      
      // Update all archived requests to DELETED status
      const { error: updateRequestsError } = await supabase
        .from('certificate_requests')
        .update({ status: 'DELETED' })
        .eq('status', 'ARCHIVED');
        
      if (updateRequestsError) {
        console.warn('Could not update archived requests:', updateRequestsError);
      }
      
      // Delete all certificates
      const { error } = await supabase
        .from('certificates')
        .delete()
        .neq('id', 'none');

      if (error) throw error;

      toast.success('All certificates deleted successfully');
      setConfirmBulkDelete(false);
    } catch (error) {
      console.error('Error bulk deleting certificates:', error);
      toast.error('Failed to delete certificates. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deletingCertificateId,
    setDeletingCertificateId,
    confirmBulkDelete,
    setConfirmBulkDelete,
    handleDeleteCertificate,
    handleBulkDelete,
    getDownloadUrl,
    isDeleting,
    isAdmin: profile?.role === 'SA'
  };
}