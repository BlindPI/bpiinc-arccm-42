
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';

export default function OpportunitiesManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your sales opportunities through the complete sales cycle
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>
            Interactive Kanban board view of your opportunities by stage with drag-and-drop functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpportunityPipeline />
        </CardContent>
      </Card>
    </div>
  );
}
