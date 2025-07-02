
import { Button } from '@/components/ui/button';
import { CheckCircle2, Folder, FileCheck } from 'lucide-react';
import { useBatchUpload } from './BatchCertificateContext';

export function BatchSubmitSuccess() {
  const { resetForm, onNavigateToTab } = useBatchUpload();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-semibold text-center">Submission Successful</h3>
      
      <p className="text-center text-muted-foreground max-w-md">
        The batch of certificate requests has been submitted successfully. 
        You can track the status of your requests in the Pending Approvals tab.
      </p>
      
      <div className="pt-4 flex gap-3 justify-center">
        {onNavigateToTab && (
          <Button 
            onClick={() => onNavigateToTab('requests')}
            size="lg"
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            View Pending Requests
          </Button>
        )}
        <Button 
          onClick={resetForm}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Folder className="h-4 w-4" />
          Submit Another Batch
        </Button>
      </div>
    </div>
  );
}
