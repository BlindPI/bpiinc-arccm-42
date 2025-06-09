
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BulkActionsPanelProps {
  selectedTeams: string[];
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

export function BulkActionsPanel({ selectedTeams, selectedCount, onBulkAction }: BulkActionsPanelProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedCount} teams selected
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('archive')}
            >
              Archive
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('delete')}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
