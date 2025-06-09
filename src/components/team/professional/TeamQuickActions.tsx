
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamQuickActionsProps {
  members?: any[];
  onAction: (action: string) => void;
}

export function TeamQuickActions({ members = [], onAction }: TeamQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction('invite')}
          >
            Invite Members
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAction('export')}
          >
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
