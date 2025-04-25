
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { processExcelFile, processCSVFile } from '../utils/fileProcessing';
import { processRosterData } from '../utils/rosterValidation';
import { useBatchUpload } from './BatchCertificateContext';
import type { ProcessingStatus } from '../types';
import type { RosterEntry } from '../utils/rosterValidation';
import type { Certificate } from '@/types/supabase-schema';

export function useBatchUploadHandler() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const {
    selectedCourseId,
    issueDate,
    isValidated,
    setIsUploading,
    setProcessingStatus,
    setProcessedData
  } = useBatchUpload();

  const processFileContents = useCallback(async (file: File) => {
    if (!selectedCourseId || !issueDate || !user) {
      toast.error('Please select a course and issue date before uploading');
      return;
    }
    
    if (!isValidated) {
      toast.error('Please complete the validation checklist before uploading');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Process the file based on its type and get the rows
      const fileData = await processFileData(file);
      
      // Transform and validate the data
      const { processedData: validatedData, totalCount, errorCount } = processRosterData(fileData);
      
      setProcessedData({ data: validatedData, totalCount, errorCount });

      // If there are errors, don't proceed with submission
      if (errorCount > 0) {
        toast.warning(`Found ${errorCount} record(s) with issues. Please review before submitting.`);
        setIsUploading(false);
        return;
      }

      // Set initial processing status
      setProcessingStatus({
        total: validatedData.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
      
      await processValidatedData(validatedData);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  }, [selectedCourseId, issueDate, user, isValidated, setIsUploading, setProcessingStatus, setProcessedData]);

  return { processFileContents };
}

async function processFileData(file: File): Promise<Record<string, any>[]> {
  const fileType = file.name.toLowerCase();
  
  if (fileType.endsWith('.xlsx')) {
    return processExcelFile(file);
  } else if (fileType.endsWith('.csv')) {
    return processCSVFile(file);
  } else {
    throw new Error('Unsupported file type. Please upload a CSV or XLSX file.');
  }
}

async function processValidatedData(validatedData: RosterEntry[]): Promise<void> {
  const processingStatus: ProcessingStatus = {
    total: validatedData.length,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Get the course name from the selected course ID
  const { data: courseData } = await supabase
    .from('courses')
    .select('name, expiration_months')
    .eq('id', validatedData[0].courseId) // Using courseId from the first entry
    .single();

  if (!courseData) {
    throw new Error('Selected course not found');
  }

  // Process each entry in the validated data
  for (const entry of validatedData) {
    try {
      processingStatus.processed++;
      
      // Calculate expiry date based on course expiration months
      const issueDate = new Date(entry.issueDate);
      const expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + (courseData.expiration_months || 24));
      
      // Create the certificate request
      const { data: requestData, error: requestError } = await supabase
        .from('certificate_requests')
        .insert({
          course_name: courseData.name, // Use course name, not ID
          recipient_name: entry.studentName,
          email: entry.email,
          phone: entry.phone,
          company: entry.company,
          city: entry.city,
          province: entry.province,
          postal_code: entry.postalCode,
          first_aid_level: entry.firstAidLevel,
          cpr_level: entry.cprLevel,
          assessment_status: entry.assessmentStatus,
          issue_date: entry.issueDate,
          expiry_date: expiryDate.toISOString().split('T')[0],
          status: 'PENDING'
        })
        .select()
        .single();
      
      if (requestError) {
        throw requestError;
      }
      
      processingStatus.successful++;
      
    } catch (error) {
      console.error('Error processing entry:', error);
      processingStatus.failed++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      processingStatus.errors.push(`Error for ${entry.studentName}: ${errorMessage}`);
    }
  }

  return;
}
