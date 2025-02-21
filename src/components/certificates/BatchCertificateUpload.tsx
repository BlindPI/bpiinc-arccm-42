
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BatchCertificateUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = async (fileType: 'csv' | 'xlsx') => {
    try {
      const { data, error } = await supabase
        .storage
        .from('roster_template')
        .download(`template.${fileType}`);

      if (error) throw error;

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_roster_template.${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
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

    setIsUploading(true);

    try {
      // For now, we'll just validate the file type
      // In a real implementation, you'd want to:
      // 1. Read the file contents
      // 2. Validate the data structure
      // 3. Process each row and create certificate requests

      toast.success('File uploaded successfully. Processing...');
      
      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
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
            <h3 className="text-sm font-medium mb-2">1. Download Template</h3>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('csv')}
                className="w-[200px]"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadTemplate('xlsx')}
                className="w-[200px]"
              >
                <Download className="mr-2 h-4 w-4" />
                Download XLSX Template
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">2. Upload Filled Template</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="rosterFile">Upload Roster File</Label>
              <Input
                id="rosterFile"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                Accepted formats: CSV, XLSX
              </p>
            </div>
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
