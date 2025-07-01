
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRosterCertificateCount } from '@/hooks/useRosterCertificateCount';

interface RosterCountIndicatorProps {
  rosterId: string;
  storedCount: number;
  showFixButton?: boolean;
}

export function RosterCountIndicator({ 
  rosterId, 
  storedCount, 
  showFixButton = true 
}: RosterCountIndicatorProps) {
  const { actualCount, isLoading, fixCount, isFixing } = useRosterCertificateCount(rosterId);
  
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  const hasDiscrepancy = actualCount !== undefined && actualCount !== storedCount;

  if (!hasDiscrepancy) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {storedCount}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {storedCount} (actual: {actualCount})
      </Badge>
      
      {showFixButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fixCount(actualCount!)}
          disabled={isFixing}
          className="h-6 px-2 text-xs"
        >
          {isFixing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            'Fix'
          )}
        </Button>
      )}
    </div>
  );
}
