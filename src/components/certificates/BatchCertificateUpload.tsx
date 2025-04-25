import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format, addMonths, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { ProcessingStatus as ProcessingStatusType } from './types';
import { validateRowData } from './utils/validation';
import { processExcelFile, processCSVFile } from './utils/fileProcessing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchUploadForm } from './BatchUploadForm';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { cn } from "@/lib/utils";
import { RosterReview } from "./RosterReview";
import { processRosterData } from "./utils/rosterValidation";

export function BatchCertificateUpload() {
  const { data: user } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [processedData, setProcessedData] = useState<{
    data: any[];
    totalCount: number;
    errorCount: number;
  } | null>(null);

  const { data: selectedCourse } = useQuery({
    queryKey: ['courses', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const { data, error } = await supabase
        .from('courses')
        .select('name, expiration_months')
        .eq('id', selectedCourseId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId
  });

  const expiryDate = selectedCourse && issueDate ? 
    format(addMonths(parseISO(issueDate), selectedCourse.expiration_months), 'yyyy-MM-dd') : '';

  const processFileContents = async (file: File) => {
    if (!selectedCourse || !selectedCourseId || !issueDate || !user) {
      toast.error('Please select a course and issue date before uploading');
      return;
    }
    
    if (!isValidated) {
      toast.error('Please complete the validation checklist before uploading');
      return;
    }
    
    try {
      const rows = file.name.toLowerCase().endsWith('.xlsx') 
        ? await processExcelFile(file) 
        : await processCSVFile(file);
      
      // Process and validate the roster data
      const { processedData: processedRosterData, totalCount, errorCount } = processRosterData(rows);
      setProcessedData({ data: processedRosterData, totalCount, errorCount });

      setProcessingStatus({
        total: rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
      
      const parsedIssueDate = parseISO(issueDate);
      const expiryDate = addMonths(parsedIssueDate, selectedCourse.expiration_months);
      
      for (const rowData of rows) {
        if (Object.keys(rowData).length === 0) continue;
        
        try {
          const validationErrors = validateRowData(rowData, rows.indexOf(rowData), selectedCourse);
          
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
          
          const { data: insertedRequest, error: insertError } = await supabase
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
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error inserting row:', insertError);
            setProcessingStatus(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: prev.processed + 1,
                failed: prev.failed + 1,
                errors: [...prev.errors, `Row ${rows.indexOf(rowData) + 1}: ${insertError.message}`]
              };
            });
          } else {
            console.log('Successfully inserted request:', insertedRequest);
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
          console.error('Error processing row:', error);
          setProcessingStatus(prev => {
            if (!prev) return null;
            return {
              ...prev,
              processed: prev.processed + 1,
              failed: prev.failed + 1,
              errors: [...prev.errors, `Row ${rows.indexOf(rowData) + 1}: Processing error - ${error.message}`]
            };
          });
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
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
    <Card className="shadow-xl border-2 border-card card-gradient animate-fade-in">
      <CardHeader>
        <CardTitle>
          <span className="text-gradient-primary">
            Roster Submission - Batch
          </span>
        </CardTitle>
        <CardDescription>
          Upload a roster file (XLSX or CSV) to process multiple certificate requests at once.<br />
          <span className="font-medium">Download one of our templates below to ensure correct formatting:</span>
        </CardDescription>
        <div className="mt-2">
          <TemplateDownloadOptions />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="p-0 sm:p-2 rounded-xl bg-muted/40 card-gradient">
            <BatchUploadForm
              selectedCourseId={selectedCourseId}
              setSelectedCourseId={setSelectedCourseId}
              issueDate={issueDate}
              setIssueDate={setIssueDate}
              isValidated={isValidated}
              setIsValidated={setIsValidated}
              expiryDate={expiryDate}
              isUploading={isUploading}
              processingStatus={processingStatus}
              onFileUpload={processFileContents}
            />
          </div>

          {/* Roster Review */}
          {processedData && (
            <div className="border border-accent rounded-xl bg-accent/40 p-4 shadow custom-shadow animate-fade-in">
              <RosterReview 
                data={processedData.data}
                totalCount={processedData.totalCount}
                errorCount={processedData.errorCount}
              />
            </div>
          )}

          {/* Processing Status */}
          {processingStatus && (
            <div className="mt-2">
              <div className="border border-accent rounded-xl bg-accent/40 p-4 shadow custom-shadow animate-fade-in">
                <ProcessingStatus status={processingStatus} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
