
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, User } from 'lucide-react';

interface ActiveWorkflowsPanelProps {
  workflows: any[];
  loading: boolean;
}

export function ActiveWorkflowsPanel({ workflows, loading }: ActiveWorkflowsPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Active Workflows ({workflows.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflows.length > 0 ? (
            workflows.slice(0, 5).map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{workflow.instance_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {workflow.workflow_definitions?.workflow_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                      {new Date(workflow.initiated_at).toLocaleDateString()}
                    </span>
                    <User className="h-3 w-3" />
                    <span className="text-xs">{workflow.profiles?.display_name}</span>
                  </div>
                </div>
                <Badge variant={
                  workflow.workflow_status === 'pending' ? 'secondary' :
                  workflow.workflow_status === 'in_progress' ? 'default' :
                  'destructive'
                }>
                  {workflow.workflow_status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">No active workflows</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
