
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format, parse, isValid, addMonths } from 'date-fns';
import { CourseSelector } from './CourseSelector';
import { useQuery } from '@tanstack/react-query';

interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export function BatchCertificateUpload() {
  const { data: user } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Query to get the selected course details
  const { data: selectedCourse } = useQuery({
    queryKey: ['courses', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const { data, error } = await supabase
        .from('courses')
        .select('name, expiration_months')
        .eq('id', selectedCourseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId,
  });

  const validateRowData = (rowData: Record<string, string>, rowIndex: number) => {
    const errors: string[] = [];

    // Check required fields
    if (!rowData.recipient_name?.trim()) {
      errors.push(`Row ${rowIndex + 1}: Recipient name is required`);
    }
    if (!selectedCourse) {
      errors.push(`Row ${rowIndex + 1}: Valid course must be selected`);
    }

    return errors;
  };

  const calculateExpiryDate = (issueDateStr: string): string => {
    if (!selectedCourse || !issueDateStr) return '';
    
    const issueDate = new Date(issueDateStr);
    const expiryDate = addMonths(issueDate, selectedCourse.expiration_months);
    return format(expiryDate, 'yyyy-MM-dd');
  };

  const processFileContents = async (file: File) => {
    if (!selectedCourse || !selectedCourseId || !issueDate) {
      toast.error('Please select a course and issue date before uploading');
      return;
    }

    const text = await file.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());

    setProcessingStatus({
      total: rows.length - 1, // Exclude header row
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    });

    setIsUploading(true);

    // Calculate the expiry date once for all rows
    const calculatedExpiryDate = calculateExpiryDate(issueDate);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',').map(cell => cell.trim());
      
      if (row.length === headers.length && row.some(cell => cell)) {
        const rowData = Object.fromEntries(
          headers.map((header, index) => [header, row[index]])
        );

        // Validate row data before inserting
        const validationErrors = validateRowData(rowData, i);
        
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
          continue; // Skip this row and continue with the next one
        }

        try {
          const { error } = await supabase
            .from('certificate_requests')
            .insert({
              user_id: user.id,
              course_name: selectedCourse.name,
              issue_date: issueDate,
              expiry_date: calculatedExpiryDate,
              recipient_name: rowData.recipient_name.trim(),
              email: rowData.email?.trim() || null,
              phone: rowData.phone?.trim() || null,
              company: rowData.company?.trim() || null,
              first_aid_level: rowData.first_aid_level?.trim() || null,
              cpr_level: rowData.cpr_level?.trim() || null,
              assessment_status: rowData.assessment_status?.trim() || null,
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
                ? [...prev.errors, `Row ${i}: ${error.message}`]
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
              errors: [...prev.errors, `Row ${i}: Processing error`]
            };
          });
        }
      }
    }

    setIsUploading(false);
    toast.success('File processing completed');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await processFileContents(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };

  useEffect(() => {
    // Only show completion toast if processingStatus exists and processing is complete
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
          <Label htmlFor="file">Upload Roster (CSV)</Label>
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading || !selectedCourseId || !issueDate}
          />
        </div>

        {processingStatus && (
          <Alert>
            <AlertDescription>
              Processing: {processingStatus.processed} / {processingStatus.total}
              <br />
              Successful: {processingStatus.successful}
              <br />
              Failed: {processingStatus.failed}
              {processingStatus.errors.length > 0 && (
                <div className="mt-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc pl-5">
                    {processingStatus.errors.map((error, index) => (
                      <li key={index} className="text-sm text-destructive">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
