import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format, addMonths, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { ProcessingStatus as ProcessingStatusType } from './types';
import { validateRowData } from './utils/validation';
import { processExcelFile, processCSVFile } from './utils/fileProcessing';
import { BatchUploadWizard } from "./BatchUploadWizard";

export function BatchCertificateUpload() {
  const { data: user } = useProfile();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const processFileContents = async (file: File) => {
    if (!user) {
      toast.error('Please select a course and issue date before uploading');
      return;
    }
    
    try {
      setProcessingStatus(null);
      setIsUploading(true);

      let rows = [];
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        rows = await processExcelFile(file);
      } else {
        rows = await processCSVFile(file);
      }
      
      setProcessingStatus({
        total: rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
      
      for (const [i, rowData] of rows.entries()) {
        if (Object.keys(rowData).length === 0) continue;
        
        try {
          const validationErrors = validateRowData(rowData, i, null);
          
          if (validationErrors.length > 0) {
            setProcessingStatus(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: prev.processed + 1,
                failed: prev.failed + 1,
                errors: [...prev.errors, ...validationErrors]
              };
            });
            continue;
          }
          
          const { data: selectedCourse } = await supabase
            .from('courses')
            .select('name, expiration_months')
            .eq('id', rowData.courseId)
            .maybeSingle();
            
          const parsedIssueDate = parseISO(rowData.issueDate);
          const expiryDate = addMonths(parsedIssueDate, selectedCourse.expiration_months);
          
          const { error: insertError } = await supabase
            .from('certificate_requests')
            .insert({
              user_id: user.id,
              course_name: selectedCourse.name,
              issue_date: format(parsedIssueDate, 'yyyy-MM-dd'),
              expiry_date: format(expiryDate, 'yyyy-MM-dd'),
              recipient_name: rowData['Student Name'],
              email: rowData['Email'] || null,
              phone: rowData['Phone'] || null,
              company: rowData['Company'] || null,
              first_aid_level: rowData['First Aid Level'] || null,
              cpr_level: rowData['CPR Level'] || null,
              assessment_status: rowData['Pass/Fail']?.toUpperCase() || null,
              status: 'PENDING'
            });
            
          if (insertError) {
            setProcessingStatus(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: prev.processed + 1,
                failed: prev.failed + 1,
                errors: [...prev.errors, `Row ${i + 1}: ${insertError.message}`]
              };
            });
          } else {
            setProcessingStatus(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: prev.processed + 1,
                successful: prev.successful + 1
              };
            });
          }
        } catch (error) {
          setProcessingStatus(prev => {
            if (!prev) return null;
            return {
              ...prev,
              processed: prev.processed + 1,
              failed: prev.failed + 1,
              errors: [...prev.errors, `Row ${i + 1}: Processing error - ${error.message}`]
            };
          });
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error processing file');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (processingStatus && processingStatus.processed === processingStatus.total) {
      const message = `Processing complete. ${processingStatus.successful} successful, ${processingStatus.failed} failed.`;
      if (processingStatus.failed > 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }
  }, [processingStatus]);

  return (
    <BatchUploadWizard
      processFileContents={processFileContents}
      isUploading={isUploading}
      processingStatus={processingStatus}
    />
  );
}
