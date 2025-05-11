
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { addMonths, format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useLocationData } from '@/hooks/useLocationData';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    processedData, 
    selectedLocationId, 
    setCurrentStep 
  } = useBatchUpload();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: courses } = useCourseData();
  const { locations } = useLocationData();

  // Generate a batch ID based on user, location, date and instructor
  const generateBatchId = (instructorName: string | undefined, issueDate: string) => {
    // Get user initials (from display name or email)
    const userInitials = profile?.display_name 
      ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : (user?.email?.substring(0, 2) || 'UN');
    
    // Get location shortcode
    let locationCode = 'UNK';
    if (selectedLocationId && selectedLocationId !== 'none') {
      const location = locations?.find(l => l.id === selectedLocationId);
      if (location) {
        // Take first 3 characters of location name
        locationCode = location.name.substring(0, 3).toUpperCase();
      }
    }
    
    // Format date as YYYYMMDD
    const dateFormatted = issueDate.replace(/-/g, '');
    
    // Get instructor initials (first 2 characters)
    const instructorInitials = instructorName 
      ? instructorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : 'IN';
    
    // Generate batch ID
    return `${userInitials}-${locationCode}-${dateFormatted}-${instructorInitials}`;
  };

  // Generate a human-readable batch name
  const generateBatchName = (courseName: string, instructorName: string | undefined, issueDate: string) => {
    // Get formatted date
    const date = new Date(issueDate);
    const formattedDate = isNaN(date.getTime()) ? issueDate : format(date, 'MMM d, yyyy');
    
    // Get location name
    let locationName = '';
    if (selectedLocationId && selectedLocationId !== 'none') {
      const location = locations?.find(l => l.id === selectedLocationId);
      if (location) {
        locationName = ` at ${location.name}`;
      }
    }
    
    // Format instructor part
    const instructorPart = instructorName ? ` by ${instructorName}` : '';
    
    // Generate batch name
    return `${courseName}${locationName} - ${formattedDate}${instructorPart}`;
  };

  // Get all admin users to notify them of batch uploads
  const getAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .in('role', ['SA', 'AD']);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  };

  // Helper function to calculate expiry date when missing
  const calculateExpiryDate = (issueDate: string, courseId: string | undefined) => {
    try {
      if (!issueDate) return null;
      
      // Find course to get expiration months
      let expirationMonths = 24; // Default to 24 months if not specified
      if (courseId && courses) {
        const selectedCourse = courses.find(c => c.id === courseId);
        if (selectedCourse?.expiration_months) {
          expirationMonths = selectedCourse.expiration_months;
        }
      }
      
      // Parse the issue date and add expiration months
      const parsedIssueDate = new Date(issueDate);
      if (isNaN(parsedIssueDate.getTime())) {
        return format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd');
      }
      
      const expiryDate = addMonths(parsedIssueDate, expirationMonths);
      return format(expiryDate, 'yyyy-MM-dd');
    } catch (e) {
      console.error('Error calculating expiry date:', e);
      // Return a default expiry date of 2 years from today as a fallback
      return format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd');
    }
  };

  const submitBatch = async () => {
    if (isSubmitting) {
      toast.error('Already submitting batch');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit certificates');
      return;
    }

    if (!processedData || processedData.data.length === 0) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting batch submission...');

    try {
      // Extract common instructor name and date for batch ID
      const firstValidEntry = processedData.data.find(row => row.isProcessed && !row.error);
      if (!firstValidEntry) {
        toast.error('No valid entries found');
        setIsSubmitting(false);
        return;
      }

      // Generate batch ID and name
      const instructorName = firstValidEntry.instructorName;
      const issueDate = firstValidEntry.issueDate || new Date().toISOString().split('T')[0];
      const batchId = generateBatchId(instructorName, issueDate);
      
      // Use first course name for the batch name
      let courseName = '';
      if (firstValidEntry.courseMatches && firstValidEntry.courseMatches.length > 0) {
        courseName = firstValidEntry.courseMatches[0].courseName;
      } else if (courses) {
        // Try to get course name from selected course ID
        const course = courses.find(c => c.id === firstValidEntry.courseId);
        if (course) {
          courseName = course.name;
        }
      }
      
      if (!courseName) {
        courseName = "Certificate Batch";
      }
      
      const batchName = generateBatchName(courseName, instructorName, issueDate);
      
      console.log(`Generated batch ID: ${batchId}, name: ${batchName}`);

      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error)
        .map(row => {
          // Use course match if available
          let courseName = '';
          let courseId = undefined;
          
          if (row.courseMatches && row.courseMatches.length > 0) {
            // Use the best match (first in the array)
            courseName = row.courseMatches[0].courseName;
            courseId = row.courseMatches[0].courseId;
          }
          
          // Ensure expiry date is set - this is critical to prevent DB errors
          const expiryDate = row.expiryDate || calculateExpiryDate(row.issueDate, courseId);
          
          if (!expiryDate) {
            console.warn(`No expiry date could be calculated for ${row.name}, using default 2-year expiration`);
          }
          
          return {
            recipient_name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            course_name: courseName, // This is what's actually stored in the DB
            issue_date: row.issueDate,
            expiry_date: expiryDate || format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd'),
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            status: 'PENDING', // Always set to PENDING so admins can review
            user_id: user.id,
            location_id: selectedLocationId !== 'none' ? selectedLocationId : null,
            batch_id: batchId,
            batch_name: batchName,
            instructor_name: row.instructorName || instructorName
          };
        });

      if (requests.length === 0) {
        toast.error('No valid records to submit');
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting certificate requests:', requests);

      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests)
        .select('id');

      if (error) {
        throw error;
      }

      const successCount = data?.length || 0;
      
      toast.success(`Successfully submitted ${successCount} certificate requests for review`);
      
      try {
        // Get all admin users to notify them
        const adminUsers = await getAdminUsers();
        
        console.log(`Sending notifications to ${adminUsers.length} administrators`);
        
        // Send notification to each administrator individually
        for (const admin of adminUsers) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                userId: admin.id,
                type: 'CERTIFICATE_REQUEST',
                title: 'Batch Certificate Request',
                message: `A batch of ${successCount} certificate requests has been submitted by ${user.email} and is awaiting review.`,
                priority: 'HIGH',
                category: 'CERTIFICATE'
              }
            });
            console.log(`Notification sent to admin: ${admin.email}`);
          } catch (notificationError) {
            console.error(`Error sending notification to admin ${admin.email}:`, notificationError);
          }
        }

        // Also send a system-level notification
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            title: 'Batch Certificate Request',
            message: `Batch "${batchName}" (${batchId}) with ${successCount} certificate requests has been submitted and is awaiting review.`,
            priority: 'HIGH',
            category: 'CERTIFICATE'
          }
        });
        
      } catch (notificationError) {
        console.error('Error sending batch notifications:', notificationError);
        // Don't fail the process if notifications have issues
      }

      // Change step to complete
      setCurrentStep('COMPLETE');
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(`Error submitting batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBatch, isSubmitting };
}
