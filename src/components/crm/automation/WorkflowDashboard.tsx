
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock
} from 'lucide-react';
import { WorkflowAutomationService } from '@/services/crm/workflowAutomationService';
import type { LeadWorkflow, WorkflowExecution } from '@/types/crm';
import { toast } from 'sonner';

export const WorkflowDashboard: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<LeadWorkflow | null>(null);
  const queryClient = useQueryClient();

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['lead-workflows'],
    queryFn: () => WorkflowAutomationService.getLeadWorkflows()
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => WorkflowAutomationService.getWorkflowExecutions()
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['workflow-analytics'],
    queryFn: () => WorkflowAutomationService.getWorkflowAnalytics()
  });

  const { mutate: toggleWorkflow } = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      WorkflowAutomationService.updateLeadWorkflow(id, { is_active }),
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-workflows'] });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      'failed': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      'running': { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
      'pending': { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (workflowsLoading || executionsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workflow dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Manage and monitor automated lead workflows
          </p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All workflow executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Successful executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows?.filter(w => w.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.failedExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>
                Manage your automated lead processing workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows?.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{workflow.workflow_name}</h3>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.workflow_description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Priority: {workflow.execution_priority} | Steps: {workflow.workflow_steps.length}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWorkflow({
                          id: workflow.id,
                          is_active: !workflow.is_active
                        })}
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
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!workflows || workflows.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflows found. Create your first workflow to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Monitor workflow execution history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions?.slice(0, 10).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Execution {execution.id.slice(0, 8)}</span>
                        {getStatusBadge(execution.execution_status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Started: {new Date(execution.started_at).toLocaleString()}
                      </p>
                      {execution.completed_at && (
                        <p className="text-sm text-muted-foreground">
                          Completed: {new Date(execution.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Step {execution.current_step} / {execution.step_results.length}
                      </div>
                      {execution.retry_count > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Retries: {execution.retry_count}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!executions || executions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflow executions found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>
                Detailed analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Execution Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Executions:</span>
                      <span className="font-medium">{analytics?.totalExecutions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">{analytics?.completedExecutions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{analytics?.failedExecutions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">{analytics?.successRate || 0}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Workflow Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active Workflows:</span>
                      <span className="font-medium">{workflows?.filter(w => w.is_active).length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inactive Workflows:</span>
                      <span className="font-medium">{workflows?.filter(w => !w.is_active).length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Workflows:</span>
                      <span className="font-medium">{workflows?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
