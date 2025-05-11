
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Folder, Download, ArrowLeft } from 'lucide-react';
import { useBatchUpload } from './BatchCertificateContext';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'react-router-dom';

interface BatchSubmitSuccessProps {
  batchId?: string;
  batchName?: string;
  certificatesCount?: number;
}

export function BatchSubmitSuccess({ 
  batchId,
  batchName,
  certificatesCount = 0
}: BatchSubmitSuccessProps) {
  const { resetForm } = useBatchUpload();
  const router = useRouter();
  
  const viewCertificates = () => {
    router.navigate('/certifications', { 
      state: { tab: 'certificates', filter: { batchId } } 
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border border-green-200 shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-semibold text-center">Submission Successful</h3>
      
      <p className="text-center text-muted-foreground max-w-md">
        The batch of certificate requests has been submitted successfully. 
        You can track the status of your requests in the Pending Approvals tab.
      </p>
      
      <Card className="w-full max-w-md bg-gradient-to-r from-green-50/50 to-blue-50/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Batch Name:</span>
              <span className="font-medium text-blue-700">{batchName || "Unnamed Batch"}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Certificates:</span>
              <span className="font-medium text-blue-700">{certificatesCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submitted
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={resetForm}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Folder className="h-4 w-4" />
          Submit Another Batch
        </Button>
        
        <Button
          onClick={viewCertificates}
          variant="default"
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Certificates
        </Button>
      </div>
    </div>
  );
}
