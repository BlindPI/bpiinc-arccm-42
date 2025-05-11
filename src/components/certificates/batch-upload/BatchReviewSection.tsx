
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ValidationSection } from './ValidationSection';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { FileCheck, AlertTriangle, Loader2, Info } from 'lucide-react';
import { SelectCourseSection } from './SelectCourseSection';
import { RosterReview } from '../RosterReview';
import { LocationSelector } from '../LocationSelector';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

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
  
  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="border-primary/20 shadow-md">
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
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="data-summary">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Course & Location Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SelectCourseSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
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
      
      <Card className="border-primary/20 shadow-md">
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
