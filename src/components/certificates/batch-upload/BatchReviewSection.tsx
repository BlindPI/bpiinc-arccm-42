
import React from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { Button } from '@/components/ui/button';
import { Loader2, Check, FileSpreadsheet, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function BatchReviewSection() {
  const { currentStep, processedData, setCurrentStep } = useBatchUpload();
  const { submitBatch, isSubmitting, submissionResult, processingProgress } = useBatchSubmission();
  
  const handleReviewComplete = () => {
    submitBatch();
  };
  
  const handleBack = () => {
    setCurrentStep('UPLOAD');
  };
  
  const handleNewBatch = () => {
    setCurrentStep('UPLOAD');
  };
  
  // Guard for when there's no data
  if (!processedData) {
    return (
      <div className="text-center p-8">
        <p>No data to review. Please upload a file first.</p>
        <Button onClick={handleBack} className="mt-4">Back to Upload</Button>
      </div>
    );
  }
  
  // Check if we're in the submission process
  if (currentStep === 'SUBMITTING') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <h3 className="mt-4 text-xl font-semibold">Processing Certificates</h3>
          <p className="text-gray-500 mt-1">Please wait while we process your batch submission</p>
        </div>
        
        <div className="w-full max-w-md">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2 text-center">{processingProgress}% complete</p>
        </div>
      </div>
    );
  }
  
  // Check if we're showing completion results
  if (currentStep === 'COMPLETE' && submissionResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex flex-col items-center">
          {submissionResult.success ? (
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="rounded-full bg-red-100 p-3">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          )}
          
          <h3 className="mt-4 text-xl font-semibold">
            {submissionResult.success ? 'Batch Processing Complete' : 'Processing Error'}
          </h3>
          
          <p className="text-gray-500 mt-1">{submissionResult.message}</p>
        </div>
        
        {submissionResult.success && (
          <div className="border rounded-lg p-4 w-full max-w-md bg-gray-50">
            <div className="flex justify-between mb-2">
              <span>Batch Name:</span>
              <span className="font-medium">{submissionResult.batchName}</span>
            </div>
            <div className="flex justify-between">
              <span>Certificates Created:</span>
              <span className="font-medium">{submissionResult.certificatesCount}</span>
            </div>
          </div>
        )}
        
        {submissionResult.errors && submissionResult.errors.length > 0 && (
          <Alert variant="destructive" className="w-full max-w-md">
            <AlertTitle>Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {submissionResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <Button onClick={handleNewBatch} className="mt-4">Submit Another Batch</Button>
      </div>
    );
  }
  
  // Review step UI - show data summary and processed data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Review Batch</h3>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={handleReviewComplete} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Batch'
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-2xl font-bold">{processedData.data.length}</div>
          <p className="text-xs text-muted-foreground">Total Records</p>
        </div>
        
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {processedData.data.filter(row => !row.error).length}
          </div>
          <p className="text-xs text-muted-foreground">Valid Records</p>
        </div>
        
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">
            {processedData.errorCount}
          </div>
          <p className="text-xs text-muted-foreground">Errors</p>
        </div>
      </div>
      
      {/* Sample data preview */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Course</th>
              <th className="p-2 text-left">Issue Date</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {processedData.data.slice(0, 5).map((row, index) => (
              <tr key={index} className={row.error ? "bg-red-50" : "hover:bg-muted/30"}>
                <td className="p-2 border-t">{row.name}</td>
                <td className="p-2 border-t">{row.email}</td>
                <td className="p-2 border-t">{row.courseName}</td>
                <td className="p-2 border-t">{row.issueDate}</td>
                <td className="p-2 border-t">
                  {row.error ? (
                    <span className="text-red-500 text-xs">Error: {row.error}</span>
                  ) : (
                    <span className="text-green-500 text-xs">Valid</span>
                  )}
                </td>
              </tr>
            ))}
            {processedData.data.length > 5 && (
              <tr>
                <td colSpan={5} className="p-2 border-t text-center text-muted-foreground">
                  {processedData.data.length - 5} more records...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
