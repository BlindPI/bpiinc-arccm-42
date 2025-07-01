import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { WorkflowService } from '@/services/team/workflowService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  FileText
} from 'lucide-react';

interface WorkflowQueueProps {
  teamId: string;
}

export function WorkflowQueue({ teamId }: WorkflowQueueProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const { data: workflowQueue = [], isLoading } = useQuery({
    queryKey: ['workflow-queue', user?.id],
    queryFn: () => WorkflowService.getWorkflowQueue(user?.id || ''),
    enabled: !!user?.id
  });

  const { data: teamWorkflows = [] } = useQuery({
    queryKey: ['team-workflows', teamId],
    queryFn: () => WorkflowService.getWorkflowInstances(teamId)
  });

  const approveWorkflowMutation = useMutation({
    mutationFn: ({ instanceId, notes }: { instanceId: string; notes?: string }) =>
      WorkflowService.approveWorkflow(instanceId, user?.id || '', notes),
    onSuccess: () => {
      toast.success('Workflow approved successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['team-workflows'] });
      setSelectedWorkflow(null);
      setApprovalNotes('');
    },
    onError: () => {
      toast.error('Failed to approve workflow');
    }
  });

  const rejectWorkflowMutation = useMutation({
    mutationFn: ({ instanceId, notes }: { instanceId: string; notes: string }) =>
      WorkflowService.rejectWorkflow(instanceId, user?.id || '', notes),
    onSuccess: () => {
      toast.success('Workflow rejected');
      queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
      queryClient.invalidateQueries({ queryKey: ['team-workflows'] });
      setSelectedWorkflow(null);
      setApprovalNotes('');
    },
    onError: () => {
      toast.error('Failed to reject workflow');
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'completed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'escalated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleApprove = () => {
    if (selectedWorkflow) {
      approveWorkflowMutation.mutate({
        instanceId: selectedWorkflow.id,
        notes: approvalNotes
      });
    }
  };

  const handleReject = () => {
    if (selectedWorkflow && approvalNotes.trim()) {
      rejectWorkflowMutation.mutate({
        instanceId: selectedWorkflow.id,
        notes: approvalNotes
      });
    } else {
      toast.error('Please provide a reason for rejection');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals ({workflowQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflowQueue.length > 0 ? (
            <div className="space-y-3">
              {workflowQueue.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(workflow.workflow_status)}
                        <h3 className="font-medium">{workflow.instance_name}</h3>
                        <Badge variant={getStatusColor(workflow.workflow_status)}>
                          {workflow.workflow_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Initiated: {new Date(workflow.initiated_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Entity: {workflow.entity_type}
                        </div>
                        {workflow.sla_deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(workflow.sla_deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Workflow</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Workflow Details</h4>
                            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                              <div><strong>Name:</strong> {selectedWorkflow?.instance_name}</div>
                              <div><strong>Type:</strong> {selectedWorkflow?.entity_type}</div>
                              <div><strong>Status:</strong> {selectedWorkflow?.workflow_status}</div>
                              <div><strong>Initiated:</strong> {selectedWorkflow && new Date(selectedWorkflow.initiated_at).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Approval Notes</label>
                            <Textarea
                              value={approvalNotes}
                              onChange={(e) => setApprovalNotes(e.target.value)}
                              placeholder="Add notes for your decision..."
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleApprove}
                              disabled={approveWorkflowMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={handleReject}
                              disabled={rejectWorkflowMutation.isPending || !approvalNotes.trim()}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending approvals</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Workflow History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Team Workflow History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamWorkflows.length > 0 ? (
            <div className="space-y-3">
              {teamWorkflows.slice(0, 10).map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(workflow.workflow_status)}
                    <div>
                      <p className="font-medium">{workflow.instance_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workflow.initiated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(workflow.workflow_status)}>
                    {workflow.workflow_status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflow history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
