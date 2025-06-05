
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Filter, Download, Plus } from 'lucide-react';

export default function OpportunitiesManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your sales opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>
            Kanban board view of your opportunities by stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
            <p>Start tracking your sales pipeline by creating your first opportunity.</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Opportunity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
