import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      // Parse CSV for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val));
        setPreviewData(preview);
      };
      reader.readAsText(csvFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0, errors: [] });

    try {
      // Upload file to Supabase Storage
      const fileName = `csv-imports/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-imports')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Call edge function to process CSV
      const { data, error } = await supabase.functions.invoke('process-student-csv', {
        body: { filePath: uploadData.path }
      });

      if (error) {
        throw new Error(`Processing failed: ${error.message}`);
      }

      setProgress(data.result);
      
      if (data.result.successful > 0) {
        toast.success(`Successfully imported ${data.result.successful} students`);
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 2000);
      }

      if (data.result.failed > 0) {
        toast.warning(`${data.result.failed} records had errors`);
      }

    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      setProgress(prev => prev ? { ...prev, errors: [...prev.errors, error.message] } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreviewData(null);
    setProgress(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
              </p>
              <p className="text-muted-foreground mt-2">
                or click to select a file
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Expected columns: ID, First Name, Last Name, Email, Amount spent, Date created, Enrollments, etc.
              </p>
            </div>
          )}

          {/* File Selected */}
          {file && !progress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview */}
              {previewData && previewData.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Data Preview (first 5 rows)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(previewData[0]).slice(0, 8).map((header, i) => (
                              <th key={i} className="p-2 text-left border-r font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).slice(0, 8).map((value: any, j) => (
                                <td key={j} className="p-2 border-r text-xs">
                                  {value?.toString().substring(0, 30) || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The CSV will be processed and students will be created or updated based on email addresses.
                  Existing students will be updated with new information.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Import Progress</span>
                  <span>{progress.processed} / {progress.total}</span>
                </div>
                <Progress 
                  value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} 
                  className="w-full" 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {progress.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-red-600">Errors</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {progress.errors.slice(0, 5).map((error, i) => (
                      <Alert key={i} variant="destructive">
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    ))}
                    {progress.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {progress.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {progress?.successful && progress.successful > 0 ? 'Close' : 'Cancel'}
            </Button>
            {file && !progress && (
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Import Students'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}