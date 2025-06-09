
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamTableProps {
  teams?: any[];
}

export function TeamTable({ teams = [] }: TeamTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Team Directory</h3>
          <p>No teams found</p>
        </div>
      </CardContent>
    </Card>
  );
}
