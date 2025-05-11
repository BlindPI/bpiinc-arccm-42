
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useCertificateOperations() {
  const { data: profile } = useProfile();
  const [deletingCertificateId, setDeletingCertificateId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
        .select('certificate_request_id, batch_id')
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

  // Implementation for generating a ZIP of multiple certificates
  const generateCertificatesZip = async (certificateIds: string[], certificates: any[]) => {
    if (!certificateIds.length) {
      toast.error('No certificates selected for download');
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading(`Preparing ${certificateIds.length} certificates for download...`);
    
    try {
      const zip = new JSZip();
      const selectedCerts = certificates.filter(cert => 
        certificateIds.includes(cert.id) && cert.certificate_url
      );
      
      if (selectedCerts.length === 0) {
        toast.dismiss(toastId);
        toast.error('None of the selected certificates have downloadable files');
        return;
      }
      
      // Create a folder for the certificates
      const certFolder = zip.folder("certificates");
      if (!certFolder) {
        throw new Error('Failed to create certificates folder in ZIP');
      }
      
      // Track successful and failed downloads
      let successCount = 0;
      let failCount = 0;
      
      // Process each certificate
      for (const cert of selectedCerts) {
        try {
          // Get the signed URL
          const url = await getDownloadUrl(cert.certificate_url);
          if (!url) {
            console.warn(`No URL available for certificate: ${cert.id}`);
            failCount++;
            continue;
          }
          
          // Fetch the PDF file
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Failed to fetch certificate ${cert.id}: ${response.statusText}`);
            failCount++;
            continue;
          }
          
          // Get the file as an ArrayBuffer
          const pdfBuffer = await response.arrayBuffer();
          
          // Create a safe filename
          const safeName = cert.recipient_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const safeCourse = cert.course_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${safeName}_${safeCourse}_certificate.pdf`;
          
          // Add the file to the ZIP
          certFolder.file(fileName, pdfBuffer);
          successCount++;
          
        } catch (error) {
          console.error(`Error processing certificate ${cert.id}:`, error);
          failCount++;
        }
      }
      
      // If no certificates were successfully processed
      if (successCount === 0) {
        toast.dismiss(toastId);
        toast.error('Failed to retrieve any certificate files');
        return;
      }
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Use file-saver to download the ZIP
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveAs(zipContent, `certificates_${timestamp}.zip`);
      
      // Show success message
      toast.dismiss(toastId);
      if (failCount > 0) {
        toast.success(`Downloaded ${successCount} certificates. ${failCount} failed.`);
      } else {
        toast.success(`Successfully downloaded ${successCount} certificates`);
      }
      
      // Log this bulk download action if we're logged in
      if (profile?.id) {
        try {
          await supabase
            .from('certificate_audit_logs')
            .insert({
              certificate_id: certificateIds[0],  // Log first certificate ID
              action: 'BULK_DOWNLOAD',
              performed_by: profile.id,
              reason: `Downloaded ${successCount} certificates in a batch`
            });
        } catch (logError) {
          console.error('Error logging bulk download:', logError);
        }
      }
    } catch (error) {
      console.error('Error generating certificates ZIP:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate certificates download');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate bulk stats for reports and dashboard
  const generateBulkStats = async () => {
    if (!profile?.role || !['SA', 'AD'].includes(profile.role)) {
      console.error('Only admins can generate bulk statistics');
      return null;
    }
    
    try {
      // Get counts by status - using direct query instead of RPC
      const { data: statusCountsData, error: statusError } = await supabase
        .from('certificates')
        .select('status, count(*)')
        .groupBy('status')
        .order('status');
        
      if (statusError) {
        throw statusError;
      }
      
      const statusCounts = statusCountsData?.map(item => ({
        status: item.status,
        count: parseInt(item.count, 10)
      })) || [];
      
      // Get monthly data for last 6 months - using direct query
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('certificates')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
        
      if (monthlyError) {
        throw monthlyError;
      }
      
      // Process monthly data locally
      const monthlyStats = processMonthlyData(monthlyData || [], 6);
      
      // Get top courses - using direct query
      const { data: coursesData, error: coursesError } = await supabase
        .from('certificates')
        .select('course_name, count(*)')
        .groupBy('course_name')
        .order('count', { ascending: false })
        .limit(5);
        
      if (coursesError) {
        throw coursesError;
      }
      
      const topCourses = coursesData?.map(item => ({
        course_name: item.course_name,
        count: parseInt(item.count, 10)
      })) || [];
      
      return {
        statusCounts,
        monthlyData: monthlyStats,
        topCourses
      };
      
    } catch (error) {
      console.error('Error generating bulk statistics:', error);
      return null;
    }
  };

  // Helper function to process monthly data
  const processMonthlyData = (data: any[], monthsLimit: number) => {
    const monthlyMap = new Map();
    const now = new Date();
    
    // Initialize the past months with zero counts
    for (let i = 0; i < monthsLimit; i++) {
      const month = new Date(now);
      month.setMonth(month.getMonth() - i);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM format
      monthlyMap.set(monthKey, 0);
    }
    
    // Count certificates by month
    data.forEach(cert => {
      if (cert.created_at) {
        const monthKey = cert.created_at.substring(0, 7);
        if (monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, monthlyMap.get(monthKey) + 1);
        }
      }
    });
    
    // Convert map to array of objects for easier consumption
    return Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      count
    })).reverse(); // Most recent month first
  };

  return {
    deletingCertificateId,
    setDeletingCertificateId,
    confirmBulkDelete,
    setConfirmBulkDelete,
    handleDeleteCertificate,
    handleBulkDelete,
    getDownloadUrl,
    generateCertificatesZip,
    generateBulkStats,
    isDeleting,
    isDownloading,
    isAdmin: profile?.role === 'SA' || profile?.role === 'AD'
  };
}
