
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import { CourseSelector } from './CourseSelector';
import { useQuery } from '@tanstack/react-query';
import { ProcessingStatus as ProcessingStatusType } from './types';
import { ProcessingStatus } from './ProcessingStatus';
import { validateRowData } from './utils/validation';
import { processExcelFile, processCSVFile } from './utils/fileProcessing';

export function BatchCertificateUpload() {
  const { data: user } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    enabled: !!selectedCourseId,
  });

  const processFileContents = async (file: File) => {
    if (!selectedCourse || !selectedCourseId || !issueDate) {
      toast.error('Please select a course and issue date before uploading');
      return;
    }

    try {
      const rows = file.name.toLowerCase().endsWith('.xlsx') 
        ? await processExcelFile(file)
        : await processCSVFile(file);

      setProcessingStatus({
        total: rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      });

      setIsUploading(true);

      for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        
        if (Object.keys(rowData).length === 0) continue;

        const validationErrors = validateRowData(rowData, i, selectedCourse);
        
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

        try {
          const { error } = await supabase
            .from('certificate_requests')
            .insert({
              user_id: user.id,
              course_name: selectedCourse.name,
              issue_date: issueDate,
              expiry_date: format(
                new Date(
                  new Date(issueDate).getTime() + 
                  selectedCourse.expiration_months * 30 * 24 * 60 * 60 * 1000
                ),
                'yyyy-MM-dd'
              ),
              recipient_name: rowData['Student Name'].toString().trim(),
              email: rowData['Email']?.toString().trim() || null,
              phone: rowData['Phone']?.toString().trim() || null,
              company: rowData['Company']?.toString().trim() || null,
              first_aid_level: rowData['First Aid Level']?.toString().trim() || null,
              cpr_level: rowData['CPR Level']?.toString().trim() || null,
              assessment_status: rowData['Pass/Fail']?.toString().trim().toUpperCase() || null,
              status: 'PENDING'
            });

          setProcessingStatus(prev => {
            if (!prev) return null;
            return {
              ...prev,
              processed: prev.processed + 1,
              successful: error ? prev.successful : prev.successful + 1,
              failed: error ? prev.failed + 1 : prev.failed,
              errors: error 
                ? [...prev.errors, `Row ${i + 1}: ${error.message}`]
                : prev.errors
            };
          });
        } catch (error) {
          setProcessingStatus(prev => {
            if (!prev) return null;
            return {
              ...prev,
              processed: prev.processed + 1,
              failed: prev.failed + 1,
              errors: [...prev.errors, `Row ${i + 1}: Processing error`]
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().match(/\.(csv|xlsx)$/)) {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }

    try {
      await processFileContents(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };

  useEffect(() => {
    if (processingStatus && processingStatus.processed > 0 && processingStatus.processed === processingStatus.total) {
      toast.success(`Processing complete. ${processingStatus.successful} successful, ${processingStatus.failed} failed.`);
    }
  }, [processingStatus]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <CourseSelector
          selectedCourseId={selectedCourseId}
          onCourseSelect={setSelectedCourseId}
        />

        <div>
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="file">Upload Roster (CSV or XLSX)</Label>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileUpload}
            disabled={isUploading || !selectedCourseId || !issueDate}
          />
        </div>

        {processingStatus && <ProcessingStatus status={processingStatus} />}
      </div>
    </div>
  );
}
