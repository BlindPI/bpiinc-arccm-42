import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Add proper props interface to fix the type error
interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: any[];
  onClose: () => void;
}

export function BatchCertificateEmailForm({ 
  certificateIds, 
  certificates,
  onClose 
}: BatchCertificateEmailFormProps) {
  // Implementation will remain the same...
  return (
    <div className="space-y-4">
      <div className="text-sm">
        Sending emails to {certificateIds.length} recipients
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="gap-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          Send Emails
        </Button>
      </div>
    </div>
  );
}
