
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download, Upload, Check, X, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CourseSelector } from '@/components/certificates/CourseSelector';
import { parse, isValid, format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

type ProcessingStatus = {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
};

export function BatchCertificateUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<{
    csv?: boolean;
    xlsx?: boolean;
  }>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkAllTemplates();
  }, []);

  const checkAllTemplates = async () => {
    try {
      setIsVerifying(true);
      const { data: existingFiles, error } = await supabase
        .storage
        .from('roster_template')
        .list();

      if (error) {
        console.error('Error checking templates:', error);
        return;
      }

      console.log('Found files:', existingFiles);
      setTemplateStatus({
        csv: existingFiles?.some(file => file.name === 'roster_template.csv'),
        xlsx: existingFiles?.some(file => file.name === 'roster_template.xlsx')
      });
    } catch (error) {
      console.error('Error checking templates:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const checkTemplateExists = async (fileType: 'csv' | 'xlsx') => {
    const fileName = `roster_template.${fileType}`;
    console.log(`Checking for ${fileName} existence`);
    
    const { data: existingFiles, error } = await supabase
      .storage
      .from('roster_template')
      .list();

    if (error) {
      console.error('Error checking template:', error);
      throw new Error('Failed to check template availability');
    }

    console.log('Found files:', existingFiles);
    const templateExists = existingFiles?.some(file => file.name === fileName);
    
    if (!templateExists) {
      throw new Error(`No ${fileType.toUpperCase()} template found`);
    }

    return true;
  };

  const downloadTemplate = async (fileType: 'csv' | 'xlsx') => {
    try {
      setIsVerifying(true);
      
      await checkTemplateExists(fileType);

      const { data, error } = await supabase
        .storage
        .from('roster_template')
        .download(`roster_template.${fileType}`);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_roster_template.${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Template downloaded successfully`);
    } catch (error) {
      console.error('Error downloading template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download template';
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const validateDateFormat = (dateStr: string): boolean => {
    const parsedDate = parse(dateStr, 'MMMM-dd-yyyy', new Date());
    return isValid(parsedDate);
  };

  const processFileContents = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload certificates');
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        const dataRows = rows.slice(1);
        
        setProcessingStatus({
          total: dataRows.length,
          processed: 0,
          successful: 0,
          failed: 0,
          errors: []
        });

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i].split(',').map(cell => cell.trim());
          const rowData = Object.fromEntries(
            headers.map((header, index) => [header, row[index]])
          );

          try {
            const { error } = await supabase
              .from('certificate_requests')
              .insert({
                user_id: user.id,
                course_name: rowData.course_name,
                issue_date: issueDate,
                expiry_date: rowData.expiry_date,
                recipient_name: rowData.recipient_name,
                email: rowData.email || null,
                phone: rowData.phone || null,
                company: rowData.company || null,
                first_aid_level: rowData.first_aid_level || null,
                cpr_level: rowData.cpr_level || null,
                assessment_status: rowData.assessment_status || null,
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

            if (error) {
              console.error(`Error processing row ${i + 1}:`, error);
            }
          } catch (err) {
            console.error(`Error processing row ${i + 1}:`, err);
            setProcessingStatus(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: prev.processed + 1,
                failed: prev.failed + 1,
                errors: [...prev.errors, `Row ${i + 1}: Unexpected error`]
              };
            });
          }
        }

        toast.success('File processing completed');
      };

      reader.onerror = () => {
        toast.error('Error reading file');
        setProcessingStatus(null);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
      setProcessingStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx') {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }

    // Validate required fields
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    if (!issueDate) {
      toast.error('Please enter an issue date');
      return;
    }

    if (!validateDateFormat(issueDate)) {
      toast.error('Invalid date format. Please use Month-DD-YYYY format (e.g., January-01-2024)');
      return;
    }

    setIsUploading(true);
    setProcessingStatus(null);

    try {
      await processFileContents(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
      setProcessingStatus(null);
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Certificate Requests</CardTitle>
        <CardDescription>
          Download the template, fill it with certificate information, and upload it back to create multiple requests at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">1. Configure Batch Details</h3>
            <div className="space-y-4">
              <CourseSelector 
                selectedCourseId={selectedCourseId}
                onCourseSelect={setSelectedCourseId}
              />
              
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  placeholder="e.g., January-01-2024"
                />
                <p className="text-sm text-muted-foreground">
                  Format: Month-DD-YYYY (e.g., January-01-2024)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">2. Download Template</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('csv')}
                  className="w-[200px]"
                  disabled={isVerifying || !templateStatus.csv}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
                {isVerifying ? (
                  <span className="text-muted-foreground">Checking...</span>
                ) : templateStatus.csv ? (
                  <span className="flex items-center text-green-600">
                    <Check className="mr-1 h-4 w-4" /> Template available
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <X className="mr-1 h-4 w-4" /> Template not found
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('xlsx')}
                  className="w-[200px]"
                  disabled={isVerifying || !templateStatus.xlsx}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download XLSX Template
                </Button>
                {isVerifying ? (
                  <span className="text-muted-foreground">Checking...</span>
                ) : templateStatus.xlsx ? (
                  <span className="flex items-center text-green-600">
                    <Check className="mr-1 h-4 w-4" /> Template available
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <X className="mr-1 h-4 w-4" /> Template not found
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">3. Upload Filled Template</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="rosterFile">Upload Roster File</Label>
              <Input
                id="rosterFile"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                disabled={isUploading || !selectedCourseId || !issueDate}
              />
              <p className="text-sm text-muted-foreground">
                Accepted formats: CSV, XLSX
              </p>
            </div>

            {processingStatus && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing progress ({processingStatus.processed} of {processingStatus.total})</span>
                    <span>
                      Success: {processingStatus.successful} | Failed: {processingStatus.failed}
                    </span>
                  </div>
                  <Progress 
                    value={(processingStatus.processed / processingStatus.total) * 100} 
                    className="h-2"
                  />
                </div>

                {processingStatus.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="mt-2">
                        <strong>Processing Errors:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {processingStatus.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-md border p-4 text-sm">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All required fields must be filled in the template</li>
                <li>Dates should be in the format MMMM-DD-YYYY (e.g., January-01-2024)</li>
                <li>Course names must match exactly with existing courses</li>
                <li>Large files may take a few moments to process</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
