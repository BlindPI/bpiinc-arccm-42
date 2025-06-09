
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ActiveWorkflowsPanel } from './ActiveWorkflowsPanel';
import { ApprovalQueuePanel } from './ApprovalQueuePanel';
import { WorkflowSLATracker } from './WorkflowSLATracker';

export function WorkflowExecutionDashboard() {
  const { data: workflowStats = {}, isLoading } = useQuery({
    queryKey: ['workflow-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      if (error) throw error;
      return data || {};
    },
    refetchInterval: 30000
  });

  const { data: activeWorkflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['active-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          workflow_definitions(workflow_name, workflow_type),
          profiles(display_name)
        `)
        .in('workflow_status', ['pending', 'in_progress', 'escalated'])
        .order('initiated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Workflow Execution Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage enterprise workflow automation
          </p>
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold">{workflowStats.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <div className="text-2xl font-bold">{workflowStats.approved || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <div className="text-2xl font-bold">{workflowStats.rejected || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Processing</span>
            </div>
            <div className="text-2xl font-bold">{workflowStats.avgProcessingTime || '0 days'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveWorkflowsPanel workflows={activeWorkflows} loading={workflowsLoading} />
        <ApprovalQueuePanel />
      </div>

      {/* SLA Tracker */}
      <WorkflowSLATracker />
    </div>
  );
}
