
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedTeamManagementService } from '@/services/team/enhancedTeamManagementService';
import { Workflow, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamWorkflow } from '@/types/enhanced-team-management';

interface WorkflowManagementProps {
  teamId: string;
}

export function WorkflowManagement({ teamId }: WorkflowManagementProps) {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<TeamWorkflow | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['team-workflows', teamId],
    queryFn: () => enhancedTeamManagementService.getTeamWorkflows(teamId)
  });

  const approveWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, approvedBy }: { workflowId: string; approvedBy: string }) =>
      enhancedTeamManagementService.approveWorkflow(workflowId, approvedBy),
    onSuccess: () => {
      toast.success('Workflow approved successfully');
      queryClient.invalidateQueries({ queryKey: ['team-workflows', teamId] });
      setSelectedWorkflow(null);
    },
    onError: (error) => {
      toast.error(`Failed to approve workflow: ${error.message}`);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatWorkflowType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Team Workflows ({workflows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length > 0 ? (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <h4 className="font-medium">{formatWorkflowType(workflow.workflow_type)}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(workflow.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      {workflow.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Workflow Details */}
                  <div className="mt-4 p-3 bg-muted rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Request Type:</span>
                        <p>{formatWorkflowType(workflow.workflow_type)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Requested By:</span>
                        <p className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {workflow.requested_by}
                        </p>
                      </div>
                    </div>
                    
                    {workflow.request_data && Object.keys(workflow.request_data).length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium text-sm">Request Details:</span>
                        <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
                          {JSON.stringify(workflow.request_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {workflow.completed_at && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      Completed on {new Date(workflow.completed_at).toLocaleDateString()}
                      {workflow.approved_by && ` by ${workflow.approved_by}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflows found</p>
              <p className="text-sm">Team workflows and approvals will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Review Modal */}
      {selectedWorkflow && (
        <WorkflowReviewModal
          workflow={selectedWorkflow}
          onApprove={() => approveWorkflowMutation.mutate({
            workflowId: selectedWorkflow.id,
            approvedBy: 'current-user-id' // This would be the actual current user ID
          })}
          onClose={() => setSelectedWorkflow(null)}
          isLoading={approveWorkflowMutation.isPending}
        />
      )}
    </div>
  );
}

interface WorkflowReviewModalProps {
  workflow: TeamWorkflow;
  onApprove: () => void;
  onClose: () => void;
  isLoading: boolean;
}

function WorkflowReviewModal({ workflow, onApprove, onClose, isLoading }: WorkflowReviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle>Review Workflow Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Workflow Type:</span>
              <p>{workflow.workflow_type.split('_').join(' ')}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Requested By:</span>
              <p>{workflow.requested_by}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Created:</span>
              <p>{new Date(workflow.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Status:</span>
              <Badge className={workflow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}>
                {workflow.status}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">Request Details:</span>
            <div className="mt-2 p-4 bg-muted rounded">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(workflow.request_data, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="destructive" 
              onClick={onClose}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button 
              onClick={onApprove}
              disabled={isLoading}
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
