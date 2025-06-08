
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { WorkflowApprovalService } from '@/services/governance/workflowApprovalService';
import { toast } from 'sonner';

export function WorkflowApprovalDashboard() {
  const queryClient = useQueryClient();

  const { data: pendingWorkflows = [], isLoading } = useQuery({
    queryKey: ['pending-workflows'],
    queryFn: () => WorkflowApprovalService.getPendingWorkflows()
  });

  const { data: workflowStats } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => WorkflowApprovalService.getWorkflowStats()
  });

  const approveMutation = useMutation({
    mutationFn: ({ workflowId, userId }: { workflowId: string; userId: string }) =>
      WorkflowApprovalService.approveWorkflow(workflowId, userId),
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
    mutationFn: ({ workflowId, userId, reason }: { workflowId: string; userId: string; reason?: string }) =>
      WorkflowApprovalService.rejectWorkflow(workflowId, userId, reason),
    onSuccess: () => {
      toast.success('Workflow rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
    },
    onError: () => {
      toast.error('Failed to reject workflow');
    }
  });

  const handleApprove = (workflowId: string) => {
    approveMutation.mutate({ workflowId, userId: 'current-user-id' });
  };

  const handleReject = (workflowId: string) => {
    rejectMutation.mutate({ workflowId, userId: 'current-user-id', reason: 'Manual rejection' });
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
        <h1 className="text-2xl font-bold">Workflow Approval Dashboard</h1>
        <p className="text-muted-foreground">
          Review and approve pending team workflow requests
        </p>
      </div>

      {/* Stats Overview */}
      {workflowStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{workflowStats.pending}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{workflowStats.approved}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{workflowStats.rejected}</p>
                </div>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{workflowStats.total}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending workflows</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWorkflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{workflow.workflow_type}</h3>
                      <p className="text-sm text-muted-foreground">
                        Team: {workflow.teams?.name} • 
                        Requested by: {workflow.requester?.display_name}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {workflow.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(workflow.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReject(workflow.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
