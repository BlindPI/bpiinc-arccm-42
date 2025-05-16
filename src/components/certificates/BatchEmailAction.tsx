
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BatchCertificateEmailForm } from './BatchCertificateEmailForm';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface BatchEmailActionProps {
  selectedCertificates: string[];
  certificates: any[];
}

export function BatchEmailAction({ selectedCertificates, certificates }: BatchEmailActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleOpenDialog = () => {
    if (selectedCertificates.length === 0) {
      toast.warning('Please select certificates to email');
      return;
    }
    
    // Check if all selected certificates have a PDF URL
    const certsWithoutUrl = certificates
      .filter(cert => selectedCertificates.includes(cert.id) && !cert.certificate_url)
      .length;
      
    if (certsWithoutUrl > 0) {
      toast.warning(`${certsWithoutUrl} selected certificates don't have PDFs and can't be emailed`);
      // Continue anyway, but with warning
    }
    
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5"
        onClick={handleOpenDialog}
        disabled={selectedCertificates.length === 0}
      >
        <Mail className="h-4 w-4" />
        <span>Email</span>
        {selectedCertificates.length > 0 && (
          <Badge variant="secondary" className="ml-1.5">
            {selectedCertificates.length}
          </Badge>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <BatchCertificateEmailForm
            certificateIds={selectedCertificates}
            certificates={certificates.filter(cert => selectedCertificates.includes(cert.id))}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
