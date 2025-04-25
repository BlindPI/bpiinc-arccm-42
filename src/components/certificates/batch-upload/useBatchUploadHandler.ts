
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { processRosterData } from '../utils/rosterValidation';
import { useBatchUpload } from './BatchCertificateContext';
import { processExcelFile, processCSVFile } from '../utils/fileProcessing';
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
      
      console.log('File data processed:', fileData);
      
      if (!fileData || fileData.length === 0) {
        toast.error('No data found in the uploaded file');
        setIsUploading(false);
        return;
      }
      
      // Transform and validate the data
      const { processedData: validatedData, totalCount, errorCount } = processRosterData(fileData);
      
      console.log('Validated data:', validatedData);
      console.log(`Total: ${totalCount}, Errors: ${errorCount}`);
      
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
      
      if (validatedData.length > 0) {
        await processValidatedData(validatedData);
      } else {
        toast.warning('No valid records found to process');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  }, [selectedCourseId, issueDate, user, isValidated, setIsUploading, setProcessingStatus, setProcessedData]);

  const processFileData = async (file: File): Promise<Partial<RosterEntry>[]> => {
    const fileName = file.name.toLowerCase();
    
    console.log('Processing file:', fileName);
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return processExcelFile(file);
    } else if (fileName.endsWith('.csv')) {
      return processCSVFile(file);
    } else {
      throw new Error('Unsupported file format. Please upload an XLSX or CSV file.');
    }
  };

  const processValidatedData = async (validatedData: RosterEntry[]): Promise<void> => {
    console.log(`Starting certificate creation for ${validatedData.length} records...`);
    
    const status: ProcessingStatus = {
      total: validatedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const entry of validatedData) {
      try {
        console.log(`Processing certificate for ${entry.studentName}`);
        
        // Create certificate request in the database
        const { error } = await supabase
          .from('certificate_requests')
          .insert({
            recipient_name: entry.studentName,
            email: entry.email,
            phone: entry.phone || null,
            company: entry.company || null,
            first_aid_level: entry.firstAidLevel || null,
            cpr_level: entry.cprLevel || null,
            assessment_status: entry.assessmentStatus || null,
            course_id: selectedCourseId,
            issue_date: issueDate,
            expiry_date: calculateExpiryDate(issueDate),
            status: 'PENDING',
            requester_id: user?.id,
            city: entry.city || null,
            province: entry.province || null,
            postal_code: entry.postalCode || null
          });
          
        if (error) {
          throw error;
        }
        
        status.successful++;
      } catch (error) {
        console.error(`Error processing ${entry.studentName}:`, error);
        
        status.failed++;
        status.errors.push(`${entry.studentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        status.processed++;
        setProcessingStatus({...status});
      }
    }
    
    console.log('Processing completed:', status);
    
    if (status.successful > 0) {
      toast.success(`Successfully created ${status.successful} certificate request(s)`);
    }
    
    if (status.failed > 0) {
      toast.error(`Failed to create ${status.failed} certificate request(s)`);
    }
  };

  // Helper function to calculate expiry date (1 year from issue date by default)
  const calculateExpiryDate = (issueDateStr: string): string => {
    const issueDate = new Date(issueDateStr);
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    return expiryDate.toISOString().split('T')[0];
  };

  return { processFileContents };
}
