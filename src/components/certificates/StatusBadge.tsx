
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, FileCheck, Ban, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive", icon: React.ReactNode }> = {
    PENDING: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    APPROVED: { variant: "default", icon: <FileCheck className="w-3 h-3" /> },
    REJECTED: { variant: "destructive", icon: <Ban className="w-3 h-3" /> }
  };

  const config = variants[status] || variants.PENDING;

  return (
    <div className="space-y-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
      {status === 'REJECTED' && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>
            Before submitting a new request, please download and use the correct certificate template:
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a 
                  href="https://pmwtujjyrfkzccpjigqm.supabase.co/storage/v1/object/public/certificate_template/default-template.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

