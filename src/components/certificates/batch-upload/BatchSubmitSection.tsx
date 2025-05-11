
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBatchUpload } from './BatchCertificateContext';
import { useBatchSubmission } from './useBatchSubmission';
import { Loader2 } from 'lucide-react';

export function BatchSubmitSection() {
  const { isValidated, processedData } = useBatchUpload();
  const { submitBatch, isSubmitting } = useBatchSubmission();
  
  if (!processedData) return null;
  
  const validRecordCount = processedData.data.filter(row => row.isProcessed && !row.error).length;
  const errorCount = processedData.errorCount || 0;
  
  return (
    <Card className="border-primary/20 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-semibold">
            Ready to submit {validRecordCount} valid records
          </h3>
          {errorCount > 0 && (
            <p className="text-sm text-destructive">
              {errorCount} records with errors will be skipped
            </p>
          )}
        </div>
        
        <Button
          onClick={() => submitBatch()}
          disabled={!isValidated || isSubmitting || validRecordCount === 0}
          className="min-w-[150px]"
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
      </div>
    </Card>
  );
}
