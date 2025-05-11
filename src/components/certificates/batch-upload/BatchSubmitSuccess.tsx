
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, FileText } from "lucide-react";
import { BatchData, ProcessedCertificate } from '@/types/batch-upload';
import { Card, CardContent } from '@/components/ui/card';
import { useBatchUpload } from './BatchCertificateContext';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface BatchSubmitSuccessProps {
  batchData: BatchData;
  processedCertificates: ProcessedCertificate[];
}

export function BatchSubmitSuccess({ batchData, processedCertificates }: BatchSubmitSuccessProps) {
  const { resetBatchUpload } = useBatchUpload();
  const navigate = useNavigate();
  
  const handleViewCertificates = () => {
    navigate('/certifications?tab=certificates');
    resetBatchUpload();
  };
  
  const handleUploadNew = () => {
    resetBatchUpload();
  };
  
  const successCount = processedCertificates.filter(cert => cert.success).length;
  const failureCount = processedCertificates.length - successCount;
  
  return (
    <div className="space-y-6 py-4 animate-fade-in">
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-2">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold">Batch Upload Complete!</h2>
        <p className="text-muted-foreground">
          Your certificates have been processed successfully.
        </p>
      </div>
      
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Certificates</p>
              <p className="text-3xl font-bold">{processedCertificates.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Successfully Created</p>
              <p className="text-3xl font-bold text-green-700">{successCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Failed</p>
              <p className="text-3xl font-bold text-red-700">{failureCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-medium">Batch Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Course Name:</span>
            <span className="ml-2 font-medium">{batchData.courseName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Batch Name:</span>
            <span className="ml-2 font-medium">{batchData.batchName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Issue Date:</span>
            <span className="ml-2 font-medium">{batchData.issueDate}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Expiry Date:</span>
            <span className="ml-2 font-medium">{batchData.expiryDate}</span>
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button 
          variant="outline" 
          onClick={handleUploadNew}
          className="order-1 sm:order-none"
        >
          <FileText className="h-4 w-4 mr-2" />
          Upload New Batch
        </Button>
        <Button onClick={handleViewCertificates}>
          <Download className="h-4 w-4 mr-2" />
          View Certificates
        </Button>
      </div>
    </div>
  );
}
