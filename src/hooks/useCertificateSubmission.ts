
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parse, addMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseData } from '@/hooks/useCourseData';

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
  locationId?: string;
  issueDate: string;
  expiryDate: string;
  city: string;
  province: string;
  postalCode: string;
}

export function useCertificateSubmission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: courses } = useCourseData();

  const createCertificateRequest = useMutation({
    mutationFn: async (data: CertificateData) => {
      // Find the course for validation and to get the proper course name
      const selectedCourse = courses?.find(course => course.id === data.courseId);
      
      if (!selectedCourse) {
        throw new Error('Selected course not found');
      }
      
      const { error } = await supabase.from('certificate_requests').insert({
        user_id: user?.id,
        recipient_name: data.recipientName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        first_aid_level: data.firstAidLevel,
        cpr_level: data.cprLevel,
        assessment_status: data.assessmentStatus,
        course_name: selectedCourse.name,
        location_id: data.locationId || null,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
        city: data.city,
        province: data.province,
        postal_code: data.postalCode,
      });

      if (error) throw error;

      // Send notification for new certificate request
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            recipientEmail: data.email,
            recipientName: data.recipientName,
            courseName: selectedCourse.name,
            title: 'Certificate Request Submitted',
            message: `Your certificate request for ${selectedCourse.name} has been submitted for approval.`
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

  const validateAndFormatDates = (issueDate: string, courseId: string) => {
    // Parse issue date
    const parsedIssueDate = parse(issueDate, 'yyyy-MM-dd', new Date());

    if (!isValid(parsedIssueDate)) {
      toast.error('Invalid date format. Please use YYYY-MM-DD format');
      return null;
    }

    // Find the course to determine expiration months
    const selectedCourse = courses?.find(course => course.id === courseId);
    if (!selectedCourse) {
      toast.error('Selected course not found');
      return null;
    }

    // Calculate expiry date based on course expiration months
    const expirationMonths = selectedCourse.expiration_months || 24; // Default to 24 if not specified
    const parsedExpiryDate = addMonths(parsedIssueDate, expirationMonths);

    return {
      // Update to use the Month Day, Year format
      formattedIssueDate: format(parsedIssueDate, 'MMMM d, yyyy'),
      formattedExpiryDate: format(parsedExpiryDate, 'MMMM d, yyyy'),
      parsedIssueDate,
      parsedExpiryDate
    };
  };

  return {
    createCertificateRequest,
    validateAndFormatDates,
  };
}
