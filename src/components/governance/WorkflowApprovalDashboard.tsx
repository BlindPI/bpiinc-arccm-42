
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowApprovalService } from '@/services/governance/workflowApprovalService';
import { toast } from 'sonner';

export function WorkflowApprovalDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const { data: pendingWorkflows = [], isLoading } = useQuery({
    queryKey: ['pending-workflows', user?.id],
    queryFn: () => WorkflowApprovalService.getPendingWorkflows(user?.id),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: workflowStats = {} } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => WorkflowApprovalService.getWorkflowStats()
  });

  const approveMutation = useMutation({
    mutationFn: ({ workflowId, approvalData }: { workflowId: string; approvalData?: Record<string, any> }) =>
      WorkflowApprovalService.approveWorkflow(workflowId, user?.id || '', approvalData),
    onSuccess: () => {
      toast.success('Workflow approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
    },
    onError: () => {
      toast.error('Failed to approve workflow');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ workflowId, reason }: { workflowId: string; reason?: string }) =>
      WorkflowApprovalService.rejectWorkflow(workflowId, user?.id || '', reason),
    onSuccess: () => {
      toast.success('Workflow rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
    },
    onError: () => {
      toast.error('Failed to reject workflow');
    }
  });

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'member_addition': return <User className="h-4 w-4" />;
      case 'role_update': return <CheckCircle className="h-4 w-4" />;
      case 'team_archive': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getWorkflowTitle = (type: string) => {
    switch (type) {
      case 'member_addition': return 'Add Team Member';
      case 'role_update': return 'Update Member Role';
      case 'team_archive': return 'Archive Team';
      default: return 'Unknown Workflow';
    }
  };

  const getWorkflowDescription = (workflow: any) => {
    switch (workflow.workflow_type) {
      case 'member_addition':
        return `Add ${workflow.request_data.user_email} as ${workflow.request_data.role}`;
      case 'role_update':
        return `Change role from ${workflow.request_data.from_role} to ${workflow.request_data.to_role}`;
      case 'team_archive':
        return `Archive team: ${workflow.request_data.reason}`;
      default:
        return 'Workflow approval required';
    }
  };

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
      <div>
        <h2 className="text-2xl font-bold">Workflow Approvals</h2>
        <p className="text-muted-foreground">Manage team workflow requests and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingWorkflows.length}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold">
                  {Object.entries(workflowStats)
                    .filter(([key]) => key.startsWith('approved_'))
                    .reduce((sum, [, value]) => sum + value, 0)}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected Today</p>
                <p className="text-2xl font-bold">
                  {Object.entries(workflowStats)
                    .filter(([key]) => key.startsWith('rejected_'))
                    .reduce((sum, [, value]) => sum + value, 0)}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingWorkflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending workflow approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWorkflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getWorkflowIcon(workflow.workflow_type)}
                      <div>
                        <h4 className="font-medium">{getWorkflowTitle(workflow.workflow_type)}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getWorkflowDescription(workflow)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Requested by {workflow.requester?.display_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(workflow.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {workflow.teams?.name}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveMutation.mutate({ workflowId: workflow.id })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate({ 
                          workflowId: workflow.id, 
                          reason: 'Manual rejection' 
                        })}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  
                  {/* Additional details */}
                  {workflow.request_data && Object.keys(workflow.request_data).length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(workflow.request_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
