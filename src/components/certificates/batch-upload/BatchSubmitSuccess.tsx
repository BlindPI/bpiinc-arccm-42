
import React from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BatchSubmitSuccess() {
  const { resetForm, batchName, processedData } = useBatchUpload();
  
  const successCount = processedData?.data.filter(row => row.isProcessed && !row.error).length || 0;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
      <div className="rounded-full bg-primary/20 p-3">
        <CheckCircle className="h-12 w-12 text-primary" />
      </div>
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Batch Submission Complete!</h2>
        <p className="text-muted-foreground">
          {successCount} certificate requests have been successfully submitted
        </p>
        {batchName && (
          <p className="text-sm bg-secondary/30 inline-block px-3 py-1 rounded-full">
            Batch: {batchName}
          </p>
        )}
      </div>
      
      <Card className="w-full max-w-md border-primary/20 bg-white/70 dark:bg-gray-900/70">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 text-left">
            <FileCheck className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">View Pending Requests</h3>
              <p className="text-sm text-muted-foreground">
                Your batch requests are now in the approval queue. You can track their status from the Pending Approvals section.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline"
              onClick={resetForm}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Submit Another Batch
            </Button>
            
            <Button asChild>
              <Link to="/certifications">View All Requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
