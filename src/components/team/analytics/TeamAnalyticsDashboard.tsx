
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamAnalyticsDashboardProps {
  teamId?: string;
}

export function TeamAnalyticsDashboard({ teamId }: TeamAnalyticsDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
          <p>Team performance metrics and insights</p>
          {teamId && <p className="text-xs mt-2">Team ID: {teamId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
