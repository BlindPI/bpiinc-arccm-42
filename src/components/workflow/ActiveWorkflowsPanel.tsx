
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowAutomationService } from '@/services/governance/workflowAutomationService';
import { 
  PlayCircle, 
  PauseCircle, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowInstance } from '@/types/governance';

interface ActiveWorkflowsPanelProps {
  workflows: WorkflowInstance[];
  isLoading: boolean;
}

export function ActiveWorkflowsPanel({ workflows, isLoading }: ActiveWorkflowsPanelProps) {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, updates }: { workflowId: string; updates: Partial<WorkflowInstance> }) =>
      WorkflowAutomationService.updateWorkflowInstance(workflowId, updates),
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    }
  });

  const executeStepMutation = useMutation({
    mutationFn: ({ 
      instanceId, 
      stepNumber, 
      action, 
      comments 
    }: { 
      instanceId: string; 
      stepNumber: number; 
      action: 'approved' | 'rejected';
      comments?: string;
    }) =>
      WorkflowAutomationService.executeWorkflowStep(instanceId, stepNumber, action, comments),
    onSuccess: () => {
      toast.success('Workflow step executed successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      setSelectedWorkflow(null);
    },
    onError: (error) => {
      toast.error(`Failed to execute workflow step: ${error.message}`);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLevel = (workflow: WorkflowInstance) => {
    if (!workflow.sla_deadline) return 'normal';
    
    const deadline = new Date(workflow.sla_deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline < 24) return 'urgent';
    if (hoursUntilDeadline < 72) return 'high';
    return 'normal';
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
      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows ({workflows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {workflows.map((workflow) => {
                const priority = getPriorityLevel(workflow);
                
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
                        {getStatusIcon(workflow.workflow_status)}
                        <div>
                          <h4 className="font-medium">{workflow.instance_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Step {workflow.current_step} • {workflow.entity_type}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Initiated by: {workflow.initiated_by}</span>
                            <Calendar className="h-3 w-3 ml-2" />
                            <span>{new Date(workflow.initiated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(workflow.workflow_status)}>
                          {workflow.workflow_status.replace('_', ' ')}
                        </Badge>
                        {priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                        {priority === 'high' && (
                          <Badge variant="secondary" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>

                    {workflow.sla_deadline && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        SLA Deadline: {new Date(workflow.sla_deadline).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Workflow Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedWorkflow ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{selectedWorkflow.instance_name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Entity Type:</span>
                    <p>{selectedWorkflow.entity_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={getStatusColor(selectedWorkflow.workflow_status)}>
                      {selectedWorkflow.workflow_status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Current Step:</span>
                    <p>{selectedWorkflow.current_step}</p>
                  </div>
                  <div>
                    <span className="font-medium">Escalations:</span>
                    <p>{selectedWorkflow.escalation_count}</p>
                  </div>
                </div>
              </div>

              {selectedWorkflow.workflow_data && Object.keys(selectedWorkflow.workflow_data).length > 0 && (
                <div>
                  <span className="font-medium text-sm">Workflow Data:</span>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedWorkflow.workflow_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedWorkflow.step_history && selectedWorkflow.step_history.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Step History:</span>
                  <div className="mt-2 space-y-2">
                    {selectedWorkflow.step_history.map((step, index) => (
                      <div key={index} className="border-l-2 border-muted pl-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Step {step.step_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.action}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                        {step.comments && (
                          <p className="text-xs mt-1">{step.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedWorkflow.workflow_status === 'pending' && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => executeStepMutation.mutate({
                      instanceId: selectedWorkflow.id,
                      stepNumber: selectedWorkflow.current_step,
                      action: 'rejected',
                      comments: 'Manual rejection'
                    })}
                    disabled={executeStepMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => executeStepMutation.mutate({
                      instanceId: selectedWorkflow.id,
                      stepNumber: selectedWorkflow.current_step,
                      action: 'approved',
                      comments: 'Manual approval'
                    })}
                    disabled={executeStepMutation.isPending}
                  >
                    {executeStepMutation.isPending ? 'Processing...' : 'Approve'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a workflow to view details</p>
              <p className="text-sm">Choose from the active workflows list</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
