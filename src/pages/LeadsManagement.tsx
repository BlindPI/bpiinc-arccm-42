
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadsTable } from '@/components/crm/LeadsTable';

export default function LeadsManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage and track your sales leads with comprehensive scoring and pipeline management
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>
            Comprehensive lead management with automated scoring and status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable />
        </CardContent>
      </Card>
    </div>
  );
}
