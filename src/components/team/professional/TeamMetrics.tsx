
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamMetricsProps {
  teams?: any[];
}

export function TeamMetrics({ teams = [] }: TeamMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{teams.length}</div>
            <div className="text-sm text-muted-foreground">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Pending Invites</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
