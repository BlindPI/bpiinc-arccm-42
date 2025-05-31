
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationSelector } from '../LocationSelector';
import { AlertTriangle } from 'lucide-react';

interface MandatoryLocationSelectorProps {
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
}

export function MandatoryLocationSelector({
  selectedLocationId,
  onLocationChange
}: MandatoryLocationSelectorProps) {
  return (
    <div className="space-y-2">
      <LocationSelector
        selectedLocationId={selectedLocationId}
        onLocationChange={onLocationChange}
      />
      
      {!selectedLocationId && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Location selection is required for batch uploads
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
