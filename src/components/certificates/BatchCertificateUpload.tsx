
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import { CourseSelector } from './CourseSelector';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

const REQUIRED_COLUMNS = [
  'Issue Date',
  'Student Name',
  'Email',
  'Phone',
  'Company',
  'First Aid Level',
  'CPR Level',
  'Pass/Fail',
  'City',
  'Province',
  'Postal Code',
  'Notes'
];

export function BatchCertificateUpload() {
  const { data: user } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
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

  const validateRowData = (rowData: Record<string, any>, rowIndex: number) => {
    const errors: string[] = [];

    if (!rowData['Student Name']?.toString().trim()) {
      errors.push(`Row ${rowIndex + 1}: Student name is required`);
    }

    if (!selectedCourse) {
      errors.push(`Row ${rowIndex + 1}: Valid course must be selected`);
    }

    const assessmentStatus = rowData['Pass/Fail']?.toString().trim().toUpperCase();
    if (assessmentStatus && !['PASS', 'FAIL'].includes(assessmentStatus)) {
      errors.push(`Row ${rowIndex + 1}: Pass/Fail must be either PASS or FAIL`);
    }

    // Convert phone to string and validate format (optional)
    const phone = rowData['Phone']?.toString().trim();
    if (phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) {
      errors.push(`Row ${rowIndex + 1}: Phone number format should be (XXX) XXX-XXXX`);
    }

    // Convert email to string and validate format (optional)
    const email = rowData['Email']?.toString().trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowIndex + 1}: Invalid email format`);
    }

    return errors;
  };

  const processExcelFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert all values to strings during the import
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
      header: REQUIRED_COLUMNS,
      raw: false, // This ensures all values are converted to strings
      defval: '' // Use empty string for empty cells
    });
    
    return rows.slice(1); // Skip header row
  };

  const processCSVFile = async (file: File) => {
    const text = await file.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    
    // Validate headers match required columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return rows.slice(1).map(row => {
      const values = row.split(',').map(cell => cell.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    });
  };

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
        
        if (Object.keys(rowData).length === 0) continue; // Skip empty rows

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
              assessment_status: rowData['Pass/Fail']?.toString().trim() || null,
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
