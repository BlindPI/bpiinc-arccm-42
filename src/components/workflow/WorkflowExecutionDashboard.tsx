
import React, { useEffect } from 'react';
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
import { RealTimeDataService } from '@/services/realtime/realTimeDataService';

export function WorkflowExecutionDashboard() {
  // Real workflow statistics from backend
  const { data: workflowStats = {}, isLoading } = useQuery({
    queryKey: ['workflow-statistics'],
    queryFn: () => RealTimeDataService.getWorkflowStatistics(),
    refetchInterval: 30000
  });

  // Real active workflows from backend
  const { data: activeWorkflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['active-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          workflow_definitions!inner(workflow_name, workflow_type),
          profiles!inner(display_name)
        `)
        .in('workflow_status', ['pending', 'in_progress', 'escalated'])
        .order('initiated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000
  });

  // Real workflow approvals from backend
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          *,
          workflow_instances!inner(
            instance_name,
            workflow_data,
            workflow_definitions!inner(workflow_name)
          ),
          profiles!inner(display_name)
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000
  });

  // Real SLA tracking data
  const { data: slaMetrics = [] } = useQuery({
    queryKey: ['workflow-sla-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_sla_tracking')
        .select(`
          *,
          workflow_instances!inner(
            instance_name,
            workflow_definitions!inner(workflow_name)
          )
        `)
        .eq('escalation_triggered', true)
        .order('last_breach_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000
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
            Monitor and manage enterprise workflow automation (Real Data)
          </p>
        </div>
      </div>

      {/* Real Workflow Statistics */}
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

      {/* Real Workflow Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveWorkflowsPanel workflows={activeWorkflows} loading={workflowsLoading} />
        <ApprovalQueuePanel approvals={pendingApprovals} />
      </div>

      {/* Real SLA Tracker */}
      <WorkflowSLATracker slaMetrics={slaMetrics} />

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Active Workflows</span>
              <Badge variant="default">{activeWorkflows.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending Approvals</span>
              <Badge variant="secondary">{pendingApprovals.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>SLA Breaches</span>
              <Badge variant="destructive">{slaMetrics.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
