
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValidationSection } from './ValidationSection';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { FileCheck, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { SelectCourseSection } from './SelectCourseSection';
import { RosterReview } from '../RosterReview';
import { MandatoryLocationSelector } from '../enhanced-batch-upload/MandatoryLocationSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BatchReviewSection() {
  const { 
    processedData, 
    validationConfirmed, 
    setValidationConfirmed,
    isValidated,
    selectedLocationId,
    setSelectedLocationId,
    extractedCourse,
    enableCourseMatching,
    selectedCourseId
  } = useBatchUpload();
  
  const { submitBatch, isSubmitting } = useBatchSubmission();
  
  if (!processedData) {
    return null;
  }
  
  const { data, totalCount, errorCount } = processedData;
  const hasErrors = errorCount > 0;
  
  // CRITICAL: Check for course mismatches
  const courseMismatchCount = data.filter(row => row.hasCourseMismatch).length;
  const hasCourseMismatches = courseMismatchCount > 0;
  
  const canSubmit = isValidated && selectedLocationId && !hasCourseMismatches;
  
  const handleSubmit = async () => {
    if (canSubmit) {
      await submitBatch();
    }
  };
  
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileCheck className="h-5 w-5 text-primary" />
            Review Roster Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {totalCount} records found 
                  {hasErrors && ` (${errorCount} with errors)`}
                  {hasCourseMismatches && ` (${courseMismatchCount} course mismatches)`}
                </p>
                {(hasErrors || hasCourseMismatches) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Records with errors or mismatches will be skipped
                  </p>
                )}
              </div>
            </div>
            
            <SelectCourseSection />
            
            <div className="border rounded-lg overflow-hidden">
              <RosterReview 
                data={data || []}
                enableCourseMatching={enableCourseMatching}
                selectedCourseId={selectedCourseId}
                extractedCourse={extractedCourse}
                totalCount={totalCount}
                errorCount={errorCount}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mandatory Location Selection Card */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-orange-800">
            <MapPin className="h-5 w-5" />
            Select Location (Required)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-orange-700">
              Please select the location where these certificates were issued. This is required to proceed.
            </p>
            <MandatoryLocationSelector
              selectedLocationId={selectedLocationId}
              onLocationChange={setSelectedLocationId}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Validation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationSection 
            confirmations={validationConfirmed}
            setConfirmations={setValidationConfirmed}
            hasCourseMismatches={hasCourseMismatches}
            courseMismatchCount={courseMismatchCount}
          />
        </CardContent>
        <CardFooter>
          {hasCourseMismatches && (
            <Alert variant="destructive" className="mb-4 w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Submission Blocked:</strong> {courseMismatchCount} course mismatch{courseMismatchCount !== 1 ? 'es' : ''} must be resolved.
                <br />
                <span className="text-xs">
                  Review the course matching errors above. Ensure your uploaded data matches available course combinations.
                </span>
              </AlertDescription>
            </Alert>
          )}
          {!selectedLocationId && !hasCourseMismatches && (
            <Alert variant="destructive" className="mb-4 w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a location before submitting the batch.
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : hasCourseMismatches ? (
              'Resolve Course Mismatches to Continue'
            ) : !selectedLocationId ? (
              'Select Location to Continue'
            ) : (
              'Submit Batch'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
