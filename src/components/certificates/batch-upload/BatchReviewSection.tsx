
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValidationSection } from './ValidationSection';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { FileCheck, AlertTriangle, Loader2, MapPin, CheckCircle, XCircle, User } from 'lucide-react';
import { SelectCourseSection } from './SelectCourseSection';
import { MandatoryLocationSelector } from '../enhanced-batch-upload/MandatoryLocationSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
  
  const validRecords = data.filter(record => !record.validationErrors?.length && !record.hasCourseMismatch);
  const invalidRecords = data.filter(record => record.validationErrors?.length > 0 || record.hasCourseMismatch);
  
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validRecords.length}</p>
                <p className="text-sm text-gray-600">Valid Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{invalidRecords.length}</p>
                <p className="text-sm text-gray-600">Invalid Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Selection */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileCheck className="h-5 w-5 text-primary" />
            Course Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SelectCourseSection />
        </CardContent>
      </Card>

      {/* ROSTER DETAILS - ALWAYS VISIBLE */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Review Your Roster - All Records</CardTitle>
          <div className="text-sm text-muted-foreground">
            Please carefully review all {totalCount} records below before submitting.
            {hasErrors && ` ${errorCount} records have validation errors.`}
            {hasCourseMismatches && ` ${courseMismatchCount} records have course mismatches.`}
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Summary */}
          {(hasErrors || hasCourseMismatches) && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {invalidRecords.length} record(s) have validation errors or course mismatches that will prevent submission.
                Please review the records marked in red below.
              </AlertDescription>
            </Alert>
          )}

          {/* Roster Records Table - ALWAYS VISIBLE */}
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
            {data.map((record, index) => {
              const hasValidationErrors = record.validationErrors?.length > 0;
              const hasCourseIssues = record.hasCourseMismatch;
              const isInvalid = hasValidationErrors || hasCourseIssues;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isInvalid 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isInvalid ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">{record.recipientName || 'No Name'}</p>
                        <p className="text-sm text-gray-600">{record.email || 'No Email'}</p>
                        {record.company && (
                          <p className="text-xs text-gray-500">{record.company}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={record.assessmentStatus === 'PASS' ? 'default' : 'destructive'}>
                        {record.assessmentStatus || 'N/A'}
                      </Badge>
                      {record.courseMatch && (
                        <Badge variant="outline">
                          {record.courseMatch.name}
                        </Badge>
                      )}
                      {isInvalid && (
                        <Badge variant="destructive">
                          {(record.validationErrors?.length || 0) + (hasCourseIssues ? 1 : 0)} Issue(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div><strong>First Aid:</strong> {record.firstAidLevel || 'N/A'}</div>
                    <div><strong>CPR:</strong> {record.cprLevel || 'N/A'}</div>
                    <div><strong>Phone:</strong> {record.phone || 'N/A'}</div>
                    <div><strong>Row:</strong> #{record.rowNumber}</div>
                  </div>
                  
                  {/* Show validation errors and course mismatches */}
                  {isInvalid && (
                    <div className="mt-2 space-y-1">
                      {record.validationErrors?.map((error: any, errorIndex: number) => (
                        <p key={errorIndex} className="text-xs text-red-600">
                          ❌ {error.message}
                        </p>
                      ))}
                      {hasCourseIssues && (
                        <p className="text-xs text-red-600">
                          ❌ Course mismatch: Unable to match course requirements
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
              `Submit Batch (${validRecords.length} valid records)`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
