
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { BatchValidationResult } from '@/types/certificateValidation';
import * as XLSX from 'xlsx';

interface EnhancedFileDropZoneProps {
  onFileProcessed: (data: any[], validation: BatchValidationResult) => void;
  locationId: string;
  courseId: string;
  issueDate: string;
}

export function EnhancedFileDropZone({
  onFileProcessed,
  locationId,
  courseId,
  issueDate
}: EnhancedFileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process and validate data
      const processedData = jsonData.map((row: any, index) => ({
        id: `temp-${index}`,
        recipientName: row['Name'] || row['Recipient Name'] || '',
        email: row['Email'] || '',
        phone: row['Phone'] || '',
        company: row['Company'] || '',
        courseName: row['Course'] || courseId,
        courseId,
        locationId,
        locationName: 'Selected Location',
        assessmentStatus: row['Assessment'] || 'PASS',
        issueDate,
        expiryDate: new Date(new Date(issueDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'PENDING',
        submittedBy: 'current-user',
        submittedAt: new Date().toISOString(),
        validationErrors: []
      }));

      // Validate each record
      let validRecords = 0;
      const errors: any[] = [];

      processedData.forEach((record, index) => {
        const recordErrors = [];
        
        if (!record.recipientName?.trim()) {
          recordErrors.push({ field: 'recipientName', message: 'Name is required', type: 'required' });
        }
        
        if (!record.email?.trim()) {
          recordErrors.push({ field: 'email', message: 'Email is required', type: 'required' });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
          recordErrors.push({ field: 'email', message: 'Invalid email format', type: 'invalid' });
        }

        if (recordErrors.length === 0) {
          validRecords++;
        } else {
          record.validationErrors = recordErrors;
          errors.push(...recordErrors);
        }
      });

      const validation: BatchValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings: [],
        validRecords,
        totalRecords: processedData.length
      };

      onFileProcessed(processedData, validation);
    } catch (error) {
      console.error('File processing error:', error);
      setError('Failed to process file. Please ensure it is a valid Excel file.');
    } finally {
      setIsProcessing(false);
    }
  }, [locationId, courseId, issueDate, onFileProcessed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          {isProcessing ? (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-600">Processing file...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your Excel file here
                </p>
                <p className="text-sm text-gray-600">
                  or click to browse for files
                </p>
              </div>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </label>
              </Button>
              
              <p className="text-xs text-gray-500">
                Supported formats: Excel (.xlsx, .xls)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
