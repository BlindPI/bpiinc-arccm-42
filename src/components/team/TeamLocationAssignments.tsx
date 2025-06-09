
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamLocationAssignmentsProps {
  teamId: string;
}

export function TeamLocationAssignments({ teamId }: TeamLocationAssignmentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Location Management</h3>
          <p>Manage location assignments for team {teamId}</p>
        </div>
      </CardContent>
    </Card>
  );
}
