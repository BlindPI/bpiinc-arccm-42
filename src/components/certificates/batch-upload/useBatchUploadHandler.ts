
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { processRosterData } from '../utils/rosterValidation';
import { useBatchUpload } from './BatchCertificateContext';
import type { ProcessingStatus } from '../types';
import type { RosterEntry } from '../utils/rosterValidation';

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
  }, [selectedCourseId, issueDate, user, isValidated]);

  return { processFileContents };
}

async function processFileData(file: File): Promise<Partial<RosterEntry>[]> {
  // Implementation of file processing logic
  // This would include the existing logic from processExcelFile and processCSVFile
  return [];
}

async function processValidatedData(validatedData: RosterEntry[]): Promise<void> {
  // Implementation of data processing and submission logic
  // This would include the existing certificate request creation logic
}
