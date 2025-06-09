
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowApprovalService } from '@/services/governance/workflowApprovalService';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowRequest } from '@/types/team-management';

interface ApprovalQueuePanelProps {
  pendingWorkflows: WorkflowRequest[];
  isLoading: boolean;
}

export function ApprovalQueuePanel({ pendingWorkflows, isLoading }: ApprovalQueuePanelProps) {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => 
      WorkflowApprovalService.approveWorkflow(workflowId, 'current-user-id'),
    onSuccess: () => {
      toast.success('Workflow approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      setSelectedWorkflow(null);
    },
    onError: (error) => {
      toast.error(`Failed to approve workflow: ${error.message}`);
    }
  });

  const rejectWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, reason }: { workflowId: string; reason: string }) =>
      WorkflowApprovalService.rejectWorkflow(workflowId, 'current-user-id', reason),
    onSuccess: () => {
      toast.success('Workflow rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      setSelectedWorkflow(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to reject workflow: ${error.message}`);
    }
  });

  const getUrgencyLevel = (workflow: WorkflowRequest) => {
    const createdAt = new Date(workflow.created_at);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreated > 72) return 'overdue';
    if (hoursSinceCreated > 48) return 'urgent';
    if (hoursSinceCreated > 24) return 'high';
    return 'normal';
  };

  const formatWorkflowType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals ({pendingWorkflows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {pendingWorkflows.length > 0 ? (
              <div className="space-y-4">
                {pendingWorkflows.map((workflow) => {
                  const urgency = getUrgencyLevel(workflow);
                  
                  return (
                    <div 
                      key={workflow.id} 
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${
                        selectedWorkflow?.id === workflow.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <div>
                            <h4 className="font-medium">{formatWorkflowType(workflow.workflow_type)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {workflow.teams?.name || 'Unknown Team'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Requested by: {workflow.requester?.display_name || workflow.requested_by}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline">
                            {workflow.status}
                          </Badge>
                          {urgency === 'overdue' && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          {urgency === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          {urgency === 'high' && (
                            <Badge variant="secondary" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending approvals</p>
                <p className="text-sm">All workflows are up to date</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Approval Details */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedWorkflow ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {formatWorkflowType(selectedWorkflow.workflow_type)}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Team:</span>
                    <p>{selectedWorkflow.teams?.name || 'Unknown Team'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Requested By:</span>
                    <p>{selectedWorkflow.requester?.display_name || selectedWorkflow.requested_by}</p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(selectedWorkflow.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline">
                      {selectedWorkflow.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedWorkflow.request_data && Object.keys(selectedWorkflow.request_data).length > 0 && (
                <div>
                  <span className="font-medium text-sm">Request Details:</span>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedWorkflow.request_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Rejection Reason (Optional):</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => rejectWorkflowMutation.mutate({
                    workflowId: selectedWorkflow.id,
                    reason: rejectionReason || 'No reason provided'
                  })}
                  disabled={rejectWorkflowMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {rejectWorkflowMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => approveWorkflowMutation.mutate(selectedWorkflow.id)}
                  disabled={approveWorkflowMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {approveWorkflowMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a workflow to review</p>
              <p className="text-sm">Choose from the pending approvals list</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
