
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const { impersonationState, stopImpersonation } = useAuth();

  if (!impersonationState.isImpersonating) {
    return null;
  }

  return (
    <Alert variant="destructive" className="sticky top-0 z-50 rounded-none border-t-0 border-x-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          You are currently viewing the application as{' '}
          <strong>{impersonationState.impersonatedRole}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopImpersonation()}
          className="bg-white hover:bg-gray-100"
        >
          Exit View As Mode
        </Button>
      </AlertDescription>
    </Alert>
  );
}
