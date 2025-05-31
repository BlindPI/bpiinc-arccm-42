
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { MapPin, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { MandatoryLocationSelector } from './MandatoryLocationSelector';
import { EnhancedFileDropZone } from './EnhancedFileDropZone';
import { RosterReviewSection } from './RosterReviewSection';
import { ValidationSummary } from './ValidationSummary';
import { BatchValidationResult } from '@/types/certificateValidation';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface EnhancedBatchUploadFormProps {
  onUploadComplete?: (result: any) => void;
}

export function EnhancedBatchUploadForm({ onUploadComplete }: EnhancedBatchUploadFormProps) {
  const { data: profile } = useProfile();
  const [currentStep, setCurrentStep] = useState<'setup' | 'upload' | 'review' | 'submit'>('setup');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<BatchValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  const canProceedToUpload = selectedLocationId && selectedCourseId && issueDate;
  const canProceedToReview = uploadedFile && parsedData.length > 0;
  const canSubmit = validationResult?.isValid && validationResult.validRecords > 0;

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (currentStep === 'setup' && locationId && selectedCourseId && issueDate) {
      // Auto-advance when all required fields are selected
      setTimeout(() => setCurrentStep('upload'), 500);
    }
  };

  const handleFileProcessed = (data: any[], validation: BatchValidationResult) => {
    setParsedData(data);
    setValidationResult(validation);
    setCurrentStep('review');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !profile) return;

    setIsProcessing(true);
    setSubmitProgress(0);

    try {
      // Simulate batch processing with progress updates
      const validRecords = parsedData.filter(record => !record.validationErrors?.length);
      
      for (let i = 0; i < validRecords.length; i++) {
        // Process each record
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
        setSubmitProgress(Math.round(((i + 1) / validRecords.length) * 100));
      }

      toast.success(`Successfully processed ${validRecords.length} certificate requests`);
      onUploadComplete?.(validationResult);
      
      // Reset form
      setCurrentStep('setup');
      setUploadedFile(null);
      setParsedData([]);
      setValidationResult(null);
      
    } catch (error) {
      console.error('Batch submission error:', error);
      toast.error('Failed to process batch upload');
    } finally {
      setIsProcessing(false);
      setSubmitProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Enhanced Batch Certificate Upload
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {['Setup', 'Upload', 'Review', 'Submit'].map((step, index) => {
            const stepKey = step.toLowerCase() as typeof currentStep;
            const isActive = currentStep === stepKey;
            const isCompleted = ['setup', 'upload', 'review', 'submit'].indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-primary text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                  {step}
                </span>
                {index < 3 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Setup */}
        {currentStep === 'setup' && (
          <div className="space-y-6">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Location selection is mandatory.</strong> All certificates in this batch will be associated with the selected location.
              </AlertDescription>
            </Alert>

            <MandatoryLocationSelector
              selectedLocationId={selectedLocationId}
              onLocationSelect={handleLocationSelect}
              selectedCourseId={selectedCourseId}
              onCourseSelect={setSelectedCourseId}
              issueDate={issueDate}
              onIssueDateChange={setIssueDate}
            />

            <Button 
              onClick={() => setCurrentStep('upload')} 
              disabled={!canProceedToUpload}
              className="w-full"
            >
              Continue to File Upload
            </Button>
          </div>
        )}

        {/* Step 2: Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Upload Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium">{selectedLocationId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Course:</span>
                  <p className="font-medium">{selectedCourseId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Issue Date:</span>
                  <p className="font-medium">{issueDate}</p>
                </div>
              </div>
            </div>

            <EnhancedFileDropZone
              onFileProcessed={handleFileProcessed}
              locationId={selectedLocationId}
              courseId={selectedCourseId}
              issueDate={issueDate}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                Back to Setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && validationResult && (
          <div className="space-y-6">
            <ValidationSummary result={validationResult} />
            
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Found {validationResult.errors.length} validation errors. Please review and fix before submitting.
                </AlertDescription>
              </Alert>
            )}

            <RosterReviewSection 
              data={parsedData} 
              validationResult={validationResult}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back to Upload
              </Button>
              <Button 
                onClick={() => setCurrentStep('submit')} 
                disabled={!canSubmit}
              >
                Proceed to Submit
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submit */}
        {currentStep === 'submit' && (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Submit</h3>
              <p className="text-gray-600 mb-4">
                {validationResult?.validRecords} valid certificate requests will be processed
              </p>
              
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={submitProgress} className="w-full" />
                  <p className="text-sm text-gray-600">Processing... {submitProgress}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('review')} disabled={isProcessing}>
                Back to Review
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Submit Batch'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
