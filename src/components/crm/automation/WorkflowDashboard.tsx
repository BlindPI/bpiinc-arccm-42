
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  Workflow
} from 'lucide-react';
import { WorkflowAutomationService } from '@/services/crm/workflowAutomationService';
import { toast } from 'sonner';

export function WorkflowDashboard() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['lead-workflows'],
    queryFn: () => WorkflowAutomationService.getLeadWorkflows()
  });

  const { data: executions = [], isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => WorkflowAutomationService.getWorkflowExecutions()
  });

  const { data: assignmentPerformance = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['assignment-performance'],
    queryFn: () => WorkflowAutomationService.getAssignmentPerformance()
  });

  const { data: analytics } = useQuery({
    queryKey: ['workflow-analytics'],
    queryFn: () => WorkflowAutomationService.getWorkflowAnalytics()
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, leadId }: { workflowId: string; leadId: string }) =>
      WorkflowAutomationService.executeWorkflow(workflowId, leadId),
    onSuccess: () => {
      toast.success('Workflow executed successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    },
    onError: (error) => {
      toast.error('Failed to execute workflow: ' + error.message);
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      WorkflowAutomationService.updateLeadWorkflow(id, updates),
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-workflows'] });
    },
    onError: (error) => {
      toast.error('Failed to update workflow: ' + error.message);
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id: string) => WorkflowAutomationService.deleteLeadWorkflow(id),
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-workflows'] });
    },
    onError: (error) => {
      toast.error('Failed to delete workflow: ' + error.message);
    }
  });

  const handleToggleWorkflow = (workflowId: string, isActive: boolean) => {
    updateWorkflowMutation.mutate({
      id: workflowId,
      updates: { is_active: !isActive }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (workflowsLoading || executionsLoading || performanceLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Manage automated lead workflows and assignment rules
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Workflows
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">All time executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.failedExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Workflows</CardTitle>
              <CardDescription>
                Automated workflows for lead processing and assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workflows configured</p>
                    <p className="text-sm">Create workflows to automate lead processing</p>
                  </div>
                ) : (
                  workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium">{workflow.workflow_name}</h3>
                        <p className="text-sm text-gray-500">
                          {workflow.workflow_description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={workflow.is_active ? "default" : "secondary"}>
                            {workflow.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Priority: {workflow.execution_priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow.id, workflow.is_active)}
                        >
                          {workflow.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
              <CardDescription>
                Latest workflow execution results and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent executions</p>
                  </div>
                ) : (
                  executions.slice(0, 10).map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            Workflow Execution #{execution.id.slice(0, 8)}
                          </h4>
                          <Badge className={getStatusColor(execution.execution_status)}>
                            {execution.execution_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Started: {new Date(execution.started_at).toLocaleString()}
                        </p>
                        {execution.completed_at && (
                          <p className="text-sm text-gray-500">
                            Completed: {new Date(execution.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {execution.execution_status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : execution.execution_status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Performance</CardTitle>
              <CardDescription>
                Team member assignment workload and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assignmentPerformance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance data available</p>
                  </div>
                ) : (
                  assignmentPerformance.map((performance) => (
                    <div key={performance.user_id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {performance.user_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Current Load: {performance.current_load || 0} leads
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Capacity: {Math.max(0, (performance.max_capacity || 50) - (performance.current_load || 0))} remaining
                          </div>
                          <div className="text-sm text-gray-500">
                            Quality Score: {performance.quality_score || 85}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={((performance.current_load || 0) / (performance.max_capacity || 50)) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{performance.current_load || 0} assigned</span>
                        <span>{performance.max_capacity || 50} max capacity</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {assignmentPerformance.reduce((sum, p) => sum + (p.current_load || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Active Assignments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {assignmentPerformance.length > 0 
                      ? Math.round(assignmentPerformance.reduce((sum, p) => sum + (p.quality_score || 85), 0) / assignmentPerformance.length)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-500">Average Quality Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
