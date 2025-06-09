
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Users, 
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit
} from 'lucide-react';
import { WorkflowAutomationService } from '@/services/crm/workflowAutomationService';
import { LeadAssignmentService } from '@/services/crm/leadAssignmentService';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function WorkflowDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['lead-workflows'],
    queryFn: () => WorkflowAutomationService.getLeadWorkflows()
  });

  // Fetch workflow executions
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => WorkflowAutomationService.getWorkflowExecutions()
  });

  // Fetch assignment performance
  const { data: assignmentPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['assignment-performance'],
    queryFn: () => WorkflowAutomationService.getAssignmentPerformance()
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['workflow-analytics'],
    queryFn: () => WorkflowAutomationService.getWorkflowAnalytics()
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, leadId }: { workflowId: string; leadId: string }) =>
      WorkflowAutomationService.executeWorkflow(workflowId, leadId),
    onSuccess: () => {
      toast.success('Workflow executed successfully');
      queryClient.invalidateQueries(['workflow-executions']);
    },
    onError: () => {
      toast.error('Failed to execute workflow');
    }
  });

  // Intelligent assignment mutation
  const intelligentAssignmentMutation = useMutation({
    mutationFn: (leadId: string) =>
      WorkflowAutomationService.intelligentLeadAssignment(leadId),
    onSuccess: () => {
      toast.success('Lead assigned intelligently');
      queryClient.invalidateQueries(['assignment-performance']);
    },
    onError: () => {
      toast.error('Failed to assign lead');
    }
  });

  const handleExecuteWorkflow = () => {
    if (selectedWorkflow && selectedLead) {
      executeWorkflowMutation.mutate({
        workflowId: selectedWorkflow,
        leadId: selectedLead
      });
    } else {
      toast.error('Please select both workflow and lead');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold tracking-tight">Workflow & Automation</h2>
          <p className="text-muted-foreground">
            Manage lead workflows, intelligent assignment, and performance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure Rules
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalExecutions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time workflow runs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Completed successfully
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows?.filter(w => w.is_active).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assignmentPerformance?.length 
                    ? Math.round(assignmentPerformance.reduce((acc, p) => acc + (p.quality_score || 0), 0) / assignmentPerformance.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quality score average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Execute */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Workflow Execution</CardTitle>
              <CardDescription>
                Execute workflows on leads for testing and manual triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Select Workflow</Label>
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows?.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.workflow_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Lead ID</Label>
                  <Input
                    placeholder="Enter lead ID"
                    value={selectedLead}
                    onChange={(e) => setSelectedLead(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={handleExecuteWorkflow}
                    disabled={executeWorkflowMutation.isPending}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute Workflow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Workflows</CardTitle>
              <CardDescription>
                Manage automated lead processing workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows?.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{workflow.workflow_name}</h4>
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
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
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {workflow.workflow_description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Steps: {workflow.workflow_steps?.length || 0}</span>
                      <span>Priority: {workflow.execution_priority}</span>
                      <span>Created: {formatDistanceToNow(new Date(workflow.created_at))} ago</span>
                    </div>
                  </div>
                ))}

                {(!workflows || workflows.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workflows configured</p>
                    <p className="text-sm">Create your first workflow to automate lead processing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Latest workflow execution results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions?.slice(0, 10).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.execution_status)}
                      <div>
                        <p className="font-medium text-sm">
                          Workflow: {execution.workflow_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lead: {execution.lead_id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(execution.execution_status)}>
                        {execution.execution_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(execution.started_at))} ago
                      </span>
                    </div>
                  </div>
                ))}

                {(!executions || executions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workflow executions yet</p>
                    <p className="text-sm">Execute workflows to see results here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          {/* Assignment Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Performance</CardTitle>
              <CardDescription>
                Track lead assignment quality and distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignmentPerformance?.map((performance) => (
                  <div key={performance.user_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{performance.user_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Current Load: {performance.current_leads} / {performance.max_capacity || 50}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {performance.availability_score.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={((performance.current_leads / (performance.max_capacity || 50)) * 100)} 
                      className="mb-2" 
                    />
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Leads Assigned:</span>
                        <div className="font-medium">{performance.current_leads}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality Score:</span>
                        <div className="font-medium">{performance.quality_score || 0}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Response:</span>
                        <div className="font-medium">{performance.avg_response_time || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!assignmentPerformance || assignmentPerformance.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assignment data available</p>
                    <p className="text-sm">Assignment performance will appear here once leads are assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Intelligent Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Assignment</CardTitle>
              <CardDescription>
                Automatically assign leads based on capacity and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Enter lead ID for intelligent assignment"
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => intelligentAssignmentMutation.mutate(selectedLead)}
                  disabled={intelligentAssignmentMutation.isPending || !selectedLead}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Auto Assign
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                The system will automatically assign the lead to the best available team member 
                based on current workload, performance metrics, and availability.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span>{analytics?.completedExecutions || 0}</span>
                  </div>
                  <Progress value={analytics?.successRate || 0} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Failed: {analytics?.failedExecutions || 0}</span>
                    <span>Total: {analytics?.totalExecutions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignmentPerformance?.slice(0, 5).map((perf) => (
                    <div key={perf.user_id} className="flex items-center justify-between">
                      <span className="text-sm">{perf.user_name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((perf.current_leads / (perf.max_capacity || 50)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {perf.current_leads}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
