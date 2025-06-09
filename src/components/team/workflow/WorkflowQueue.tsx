
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  AlertTriangle 
} from 'lucide-react';
import { WorkflowService, type WorkflowRequest } from '@/services/team/workflowService';
import { toast } from 'sonner';

export function WorkflowQueue() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingWorkflows = [], isLoading } = useQuery({
    queryKey: ['pending-workflows'],
    queryFn: () => WorkflowService.getPendingWorkflows(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: workflowStats } = useQuery({
    queryKey: ['workflow-statistics'],
    queryFn: () => WorkflowService.getWorkflowStatistics(),
    refetchInterval: 60000,
  });

  const approveWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, approvedBy }: { workflowId: string; approvedBy: string }) =>
      WorkflowService.approveWorkflow(workflowId, approvedBy),
    onSuccess: () => {
      toast.success('Workflow approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-statistics'] });
      setSelectedWorkflow(null);
    },
    onError: (error: any) => {
      console.error('Error approving workflow:', error);
      toast.error('Failed to approve workflow');
    }
  });

  const rejectWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, rejectedBy, reason }: { workflowId: string; rejectedBy: string; reason: string }) =>
      WorkflowService.rejectWorkflow(workflowId, rejectedBy, reason),
    onSuccess: () => {
      toast.success('Workflow rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-statistics'] });
      setSelectedWorkflow(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      console.error('Error rejecting workflow:', error);
      toast.error('Failed to reject workflow');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Queue</h2>
          <p className="text-muted-foreground">
            Manage pending workflow approvals and review requests
          </p>
        </div>
        {workflowStats && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">{workflowStats.pending}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{workflowStats.approved}</span>
              </div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <span className="font-semibold">{Math.round(workflowStats.complianceRate)}%</span>
              <p className="text-xs text-muted-foreground">Compliance</p>
            </div>
          </div>
        )}
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {pendingWorkflows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No pending workflows</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {workflow.workflow_type.replace('_', ' ').toUpperCase()}
                      <Badge className={getStatusColor(workflow.workflow_status)}>
                        {workflow.workflow_status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workflow.entity_type}: {workflow.entity_id}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Workflow Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Initiated by: {workflow.initiated_by}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Workflow Data Preview */}
                  {workflow.workflow_data && Object.keys(workflow.workflow_data).length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Request Details:</p>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(workflow.workflow_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      Review Details
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveWorkflowMutation.mutate({ 
                          workflowId: workflow.id, 
                          approvedBy: 'current-user' // Replace with actual user ID
                        })}
                        disabled={approveWorkflowMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedWorkflow && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Reject Workflow: {selectedWorkflow.workflow_type}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={() => rejectWorkflowMutation.mutate({
                    workflowId: selectedWorkflow.id,
                    rejectedBy: 'current-user', // Replace with actual user ID
                    reason: rejectionReason
                  })}
                  disabled={rejectWorkflowMutation.isPending || !rejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWorkflow(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
