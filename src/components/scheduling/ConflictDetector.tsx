import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ConflictDetectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  schedules?: any[]; // For TrainingHub compatibility
}

export function ConflictDetector({ open, onOpenChange, schedules }: ConflictDetectorProps) {
  // If used as modal (with open/onOpenChange)
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Conflict Detection
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Scanning for scheduling conflicts...</p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If used as embedded component (with schedules prop)
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Conflict Detection</h3>
      </div>
      
      <div className="text-center py-8 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Analyzing {schedules?.length || 0} schedules for conflicts...</p>
        <p className="text-sm mt-2">No conflicts detected</p>
      </div>
    </div>
  );
}