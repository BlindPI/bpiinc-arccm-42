
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { processExcelFile, processCSVFile } from '../utils/fileProcessing';
import { processRosterData } from '../utils/rosterValidation';
import { findMatchingCourse, getAllActiveCourses } from '../utils/courseMatching';
import { useBatchUpload } from './BatchCertificateContext';
import type { ProcessingStatus } from '../types';
import type { RosterEntry } from '../utils/rosterValidation';

export function useBatchUploadHandler() {
  const { user } = useAuth();
  const {
    selectedCourseId,
    issueDate,
    isValidated,
    setIsUploading,
    setProcessingStatus,
    setProcessedData,
    enableCourseMatching,
    processedData,
    setIsSubmitting
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
      setProcessingStatus(null);
      
      // Process the file based on its type and get the rows
      const fileData = await processFileData(file);
      
      // Extract any course information and issue dates from the file
      const extractedInfo = extractDataFromFile(fileData);
      
      // Transform and validate the data
      const { processedData: validatedData, totalCount, errorCount } = processRosterData(fileData, selectedCourseId, issueDate);
      
      // If course matching is enabled, find matching courses for each entry
      if (enableCourseMatching) {
        await matchCoursesForEntries(validatedData);
      }
      
      setProcessedData({ data: validatedData, totalCount, errorCount });

      // If there are errors, notify the user but don't prevent review
      if (errorCount > 0) {
        toast.warning(`Found ${errorCount} record(s) with issues. Please review before submitting.`);
      } else {
        toast.success(`Successfully processed ${totalCount} records. Ready for review.`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  }, [selectedCourseId, issueDate, user, isValidated, setIsUploading, setProcessingStatus, setProcessedData, enableCourseMatching]);

  const submitProcessedData = useCallback(async () => {
    if (!processedData || !selectedCourseId || !user) {
      toast.error('No data to submit');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the processing status object
      const processingStatus: ProcessingStatus = {
        total: processedData.data.filter(entry => !entry.hasError).length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      setProcessingStatus(processingStatus);
      
      // Filter out entries with errors
      const validEntries = processedData.data.filter(entry => !entry.hasError);
      
      if (validEntries.length === 0) {
        toast.error('No valid entries to submit');
        setIsSubmitting(false);
        return;
      }

      // Process in smaller batches to avoid timeouts
      const batchSize = 10;
      let currentBatch = 0;
      
      while (currentBatch < validEntries.length) {
        const batch = validEntries.slice(currentBatch, currentBatch + batchSize);
        
        for (const entry of batch) {
          try {
            processingStatus.processed++;
            
            // Get the course details from the entry or the default
            const courseId = entry.courseId || selectedCourseId;
            
            // Get the course name and expiration months from the selected course ID
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('name, expiration_months')
              .eq('id', courseId)
              .single();

            if (courseError || !courseData) {
              throw new Error(`Selected course not found: ${courseError?.message || 'Unknown error'}`);
            }
            
            // Calculate expiry date based on course expiration months
            const issueDate = new Date(entry.issueDate);
            const expiryDate = new Date(issueDate);
            expiryDate.setMonth(expiryDate.getMonth() + (courseData.expiration_months || 24));
            
            // Create the certificate request
            const { data: requestData, error: requestError } = await supabase
              .from('certificate_requests')
              .insert({
                course_name: courseData.name,
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
                status: 'PENDING',
                user_id: user.id
              })
              .select()
              .single();
            
            if (requestError) {
              throw requestError;
            }
            
            processingStatus.successful++;
            setProcessingStatus({...processingStatus});
            
          } catch (error) {
            console.error('Error processing entry:', error);
            processingStatus.failed++;
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            processingStatus.errors.push(`Error for ${entry.studentName}: ${errorMessage}`);
            setProcessingStatus({...processingStatus});
          }
        }
        
        // Move to next batch
        currentBatch += batchSize;
        
        // Update the processing status after each batch
        setProcessingStatus({...processingStatus});
      }
      
      // Show final status
      if (processingStatus.failed > 0) {
        toast.error(`Submission complete with errors: ${processingStatus.successful} successful, ${processingStatus.failed} failed.`);
      } else {
        toast.success(`Successfully submitted ${processingStatus.successful} certificate requests.`);
      }
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(error instanceof Error ? error.message : 'Error submitting batch');
    } finally {
      setIsSubmitting(false);
    }
  }, [processedData, selectedCourseId, user, setIsSubmitting, setProcessingStatus]);

  return { processFileContents, submitProcessedData };
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

function extractDataFromFile(fileData: Record<string, any>[]): {
  issueDate?: string;
  courseInfo?: { firstAidLevel?: string; cprLevel?: string; length?: number }
} {
  // Look for common date columns
  const dateColumns = ['Issue Date', 'Date', 'Training Date', 'Course Date'];
  const firstRow = fileData[0] || {};
  
  let issueDate: string | undefined;
  
  // Try to find a date column
  for (const column of dateColumns) {
    if (column in firstRow && firstRow[column]) {
      const potentialDate = new Date(firstRow[column]);
      if (!isNaN(potentialDate.getTime())) {
        issueDate = potentialDate.toISOString().split('T')[0];
        break;
      }
    }
  }

  // Extract course info from the first row if available
  const courseInfo = {
    firstAidLevel: firstRow['First Aid Level'],
    cprLevel: firstRow['CPR Level'],
    length: firstRow['Length'] ? parseInt(firstRow['Length']) : undefined
  };
  
  return { issueDate, courseInfo };
}

async function matchCoursesForEntries(entries: RosterEntry[]): Promise<void> {
  try {
    for (const entry of entries) {
      if (entry.hasError) continue;
      
      try {
        const matchedCourse = await findMatchingCourse(
          entry.firstAidLevel,
          entry.cprLevel,
          entry.courseId,
          entry.length
        );
        
        if (matchedCourse) {
          entry.courseId = matchedCourse.id;
          entry.matchedCourse = {
            id: matchedCourse.id,
            name: matchedCourse.name,
            matchType: matchedCourse.matchType
          };
        }
      } catch (error) {
        console.error('Error matching course for entry:', error);
      }
    }
  } catch (error) {
    console.error('Error during course matching:', error);
  }
}
