
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CertificateRequestData {
  recipient_name: string;
  recipient_email: string;
  email: string; // Added for compatibility
  phone?: string;
  company?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  first_aid_level?: string;
  cpr_level?: string;
  assessment_status?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  instructor_name?: string;
  instructor_level?: string;
  batch_id?: string;
  batch_name?: string;
  location_id?: string;
}

export const useCertificateRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCertificateRequest = async (data: CertificateRequestData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting certificate request:', data);
      
      // Ensure email field is set for compatibility
      const requestData = {
        ...data,
        email: data.recipient_email || data.email,
        status: 'PENDING'
      };

      const { error } = await supabase
        .from('certificate_requests')
        .insert(requestData);

      if (error) {
        console.error('Error submitting certificate request:', error);
        toast.error('Failed to submit certificate request');
        return { success: false, error };
      }

      toast.success('Certificate request submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveCertificateRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving certificate request:', error);
        toast.error('Failed to approve certificate request');
        return { success: false, error };
      }

      toast.success('Certificate request approved');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    }
  };

  const rejectCertificateRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason 
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting certificate request:', error);
        toast.error('Failed to reject certificate request');
        return { success: false, error };
      }

      toast.success('Certificate request rejected');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    }
  };

  return {
    submitCertificateRequest,
    approveCertificateRequest,
    rejectCertificateRequest,
    isSubmitting
  };
};
