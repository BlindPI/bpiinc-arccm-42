
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, AlertTriangle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBatchUpload } from './BatchCertificateContext';
import { ProcessingStatus } from '../ProcessingStatus';

interface BatchSubmitSectionProps {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  hasErrors?: boolean;
  disabled?: boolean;
}

export function BatchSubmitSection({ 
  onSubmit, 
  isSubmitting, 
  hasErrors = false,
  disabled = false
}: BatchSubmitSectionProps) {
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const { processingStatus } = useBatchUpload();

  const handleSubmit = async () => {
    if (hasErrors) {
      setSubmissionAttempted(true);
      return;
    }
    
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error submitting batch:', error);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-card/50">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-grow">
          <h3 className="text-lg font-medium mb-1">Submit Roster</h3>
          <p className="text-sm text-muted-foreground">
            Submit {hasErrors ? 'valid entries from' : ''} this roster to create certificate requests
          </p>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || disabled}
          className="min-w-[180px]"
          size="lg"
        >
          {isSubmitting ? (
            <>Processing...</>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Roster
            </>
          )}
        </Button>
      </div>

      {hasErrors && submissionAttempted && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Submit</AlertTitle>
          <AlertDescription>
            There are entries with errors that need to be fixed before submission.
            Either fix the errors or remove the problematic entries.
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && !submissionAttempted && (
        <Alert variant="default" className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Some entries have errors. You can fix them before submitting or proceed with only the valid entries.
          </AlertDescription>
        </Alert>
      )}

      {!hasErrors && !isSubmitting && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30">
          <Check className="h-4 w-4" />
          <AlertTitle>Ready to Submit</AlertTitle>
          <AlertDescription>
            All entries are valid and ready to be submitted.
          </AlertDescription>
        </Alert>
      )}

      {processingStatus && isSubmitting && (
        <div className="mt-4">
          <ProcessingStatus status={processingStatus} />
        </div>
      )}
    </div>
  );
}
