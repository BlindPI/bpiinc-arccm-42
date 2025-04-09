
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parse } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface CertificateData {
  recipientName: string;
  email: string;
  phone: string;
  company: string;
  firstAidLevel: string;
  cprLevel: string;
  assessmentStatus: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
}

export function useCertificateSubmission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCertificateRequest = useMutation({
    mutationFn: async (data: CertificateData) => {
      const { error } = await supabase.from('certificate_requests').insert({
        user_id: user?.id,
        recipient_name: data.recipientName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        first_aid_level: data.firstAidLevel,
        cpr_level: data.cprLevel,
        assessment_status: data.assessmentStatus,
        course_name: data.courseName,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
      });

      if (error) throw error;

      // Send notification for new certificate request
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            recipientEmail: data.email,
            recipientName: data.recipientName,
            courseName: data.courseName
          }
        });
      } catch (error) {
        console.error('Error sending notification:', error);
        toast.error('Could not send confirmation email');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Certificate request submitted successfully');
    },
    onError: (error) => {
      console.error('Error creating certificate request:', error);
      toast.error('Failed to submit certificate request');
    },
  });

  const validateAndFormatDates = (issueDate: string, expiryDate: string) => {
    // Parse dates
    const parsedIssueDate = parse(issueDate, 'MMMM-dd-yyyy', new Date());
    const parsedExpiryDate = parse(expiryDate, 'MMMM-dd-yyyy', new Date());

    if (!isValid(parsedIssueDate) || !isValid(parsedExpiryDate)) {
      toast.error('Invalid date format. Please use Month-DD-YYYY format (e.g., January-01-2024)');
      return null;
    }

    return {
      formattedIssueDate: format(parsedIssueDate, 'MMMM-dd-yyyy'),
      formattedExpiryDate: format(parsedExpiryDate, 'MMMM-dd-yyyy'),
      parsedIssueDate,
      parsedExpiryDate
    };
  };

  return {
    createCertificateRequest,
    validateAndFormatDates,
  };
}
