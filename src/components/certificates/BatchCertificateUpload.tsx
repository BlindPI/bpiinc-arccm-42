import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format, addMonths, parseISO } from 'date-fns';
import { CourseSelector } from './CourseSelector';
import { useQuery } from '@tanstack/react-query';
import { ProcessingStatus as ProcessingStatusType } from './types';
import { ProcessingStatus } from './ProcessingStatus';
import { validateRowData } from './utils/validation';
import { processExcelFile, processCSVFile } from './utils/fileProcessing';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationChecklist } from './ValidationChecklist';

export function BatchCertificateUpload() {
  const {
    data: user
  } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [rosterName, setRosterName] = useState('');

  const {
    data: selectedCourse
  } = useQuery({
    queryKey: ['courses', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const {
        data,
        error
      } = await supabase.from('courses').select('name, expiration_months').eq('id', selectedCourseId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId
  });

  const processFileContents = async (file: File) => {
    if (!selectedCourse || !selectedCourseId || !issueDate || !user || !rosterName) {
      toast.error('Please fill in all required fields before uploading');
      return;
    }
    if (!isValidated) {
      toast.error('Please complete the validation checklist before uploading');
      return;
    }
    try {
      // Parse the file
      const rows = file.name.toLowerCase().endsWith('.xlsx')
        ? await processExcelFile(file)
        : await processCSVFile(file);
      
      // Set initial processing status
      setProcessingStatus({
        total: rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
      
      setIsUploading(true);
      const parsedIssueDate = parseISO(issueDate);
      const expiryDate = addMonths(parsedIssueDate, selectedCourse.expiration_months);
      
      // 1. Create a roster upload record first
      const { data: rosterData, error: rosterError } = await supabase
        .from('roster_uploads')
        .insert({
          name: rosterName,
          uploaded_by: user.id,
          course_name: selectedCourse.name,
          issue_date: format(parsedIssueDate, 'yyyy-MM-dd'),
          expiry_date: format(expiryDate, 'yyyy-MM-dd'),
          total_records: rows.length,
          status: 'PROCESSING'
        })
        .select()
        .single();
      
      if (rosterError) {
        console.error('Error creating roster record:', rosterError);
        toast.error('Failed to create roster record');
        setIsUploading(false);
        return;
      }
      
      const rosterId = rosterData.id;
      
      // 2. Process each row and link to the roster
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
          const {
            data: insertedRequest,
            error: insertError
          } = await supabase
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
              status: 'PENDING',
              roster_id: rosterId  // Link to the roster
          }).select().single();
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
      
      // 3. Update the roster status when done
      await supabase
        .from('roster_uploads')
        .update({
          status: 'COMPLETED',
          processed_records: processingStatus?.processed || 0,
          successful_records: processingStatus?.successful || 0,
          failed_records: processingStatus?.failed || 0
        })
        .eq('id', rosterId);
        
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
    if (processingStatus && processingStatus.processed === processingStatus.total) {
      const message = `Processing complete. ${processingStatus.successful} successful, ${processingStatus.failed} failed.`;
      if (processingStatus.failed > 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }
  }, [processingStatus]);

  return <Card>
      <CardHeader>
        <CardTitle>Roster Submission - Batch</CardTitle>
        <CardDescription>
          Upload a roster file (XLSX or CSV) to process multiple certificate requests at once.
          Download one of our templates below to ensure correct formatting:
        </CardDescription>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href="https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/roster-template/roster_template.xlsx" target="_blank" rel="noopener noreferrer">
                <FileSpreadsheet className="w-4 h-4" />
                Download XLSX Template
              </a>
            </Button>
            <span className="text-xs text-muted-foreground text-center">Excel format (.xlsx)</span>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href="https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/roster-template/roster_template.csv" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4" />
                Download CSV Template
              </a>
            </Button>
            <span className="text-xs text-muted-foreground text-center">CSV format (.csv)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <CourseSelector selectedCourseId={selectedCourseId} onCourseSelect={setSelectedCourseId} />

            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input id="issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="rosterName">Roster Name</Label>
              <Input
                id="rosterName"
                value={rosterName}
                onChange={e => setRosterName(e.target.value)}
                placeholder="Enter a name for this roster"
                required
              />
            </div>

            <ValidationChecklist onValidationChange={setIsValidated} />

            <div>
              <Label htmlFor="file">Upload Roster (CSV or XLSX)</Label>
              <Input id="file" type="file" accept=".csv,.xlsx" onChange={handleFileUpload} disabled={isUploading || !selectedCourseId || !issueDate || !rosterName || !isValidated} />
            </div>

            {processingStatus && <ProcessingStatus status={processingStatus} />}
          </div>
        </div>
      </CardContent>
    </Card>;
}
