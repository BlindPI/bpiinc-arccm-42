
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValidationSection } from './ValidationSection';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { FileCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { SelectCourseSection } from './SelectCourseSection';
import { RosterReview } from '../RosterReview';
import { LocationSelector } from '../LocationSelector';
import { Label } from '@/components/ui/label';
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
    selectedCourseId,
    batchId,
    batchName
  } = useBatchUpload();
  
  const { submitBatch, isSubmitting } = useBatchSubmission();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  
  if (!processedData) {
    return null;
  }
  
  const { data, totalCount, errorCount } = processedData;
  const hasErrors = errorCount > 0;
  
  const handleSubmit = async () => {
    if (isValidated) {
      await submitBatch();
    }
  };
  
  const toggleLocationSelector = () => {
    setShowLocationSelector(!showLocationSelector);
  };
  
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileCheck className="h-5 w-5 text-primary" />
              Review Roster Data
            </CardTitle>
            
            {batchName && (
              <Badge variant="outline" className="bg-primary/10 border-primary/20">
                {batchName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {totalCount} records found {hasErrors && `(${errorCount} with errors)`}
                </p>
                {hasErrors && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Records with errors will be skipped
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleLocationSelector}
                >
                  {showLocationSelector ? 'Hide' : 'Select'} Location
                </Button>
              </div>
            </div>
            
            {showLocationSelector && (
              <div className="border rounded p-4 bg-background/50">
                <Label className="mb-2 block">Location (Optional)</Label>
                <LocationSelector 
                  selectedLocationId={selectedLocationId} 
                  onLocationChange={(locationId) => setSelectedLocationId(locationId)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select a location to associate with these certificates
                </p>
              </div>
            )}
            
            <SelectCourseSection />
            
            <div className="border rounded-lg overflow-hidden mt-4">
              <RosterReview 
                data={data}
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
      
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Validation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationSection 
            confirmations={validationConfirmed}
            setConfirmations={setValidationConfirmed}
          />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={!isValidated || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Batch'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
