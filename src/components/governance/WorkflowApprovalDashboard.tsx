
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, XCircle, AlertTriangle, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowApproval } from '@/types/analytics';

export function WorkflowApprovalDashboard() {
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<WorkflowApproval | null>(null);

  const { data: pendingApprovals = [], isLoading } = useQuery({
    queryKey: ['workflow-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          *,
          workflow_instances!inner(
            id,
            instance_name,
            entity_type,
            entity_id,
            workflow_status,
            initiated_by,
            initiated_at
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkflowApproval[];
    }
  });

  const approveWorkflowMutation = useMutation({
    mutationFn: async ({ approvalId, decision }: { approvalId: string; decision: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('workflow_approvals')
        .update({
          approval_status: decision,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow decision recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-approvals'] });
      setSelectedApproval(null);
    },
    onError: (error) => {
      toast.error(`Failed to process workflow: ${error.message}`);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Approvals</h2>
          <p className="text-muted-foreground">Review and approve pending workflow requests</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {pendingApprovals.length} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(approval.approval_status)}
                          <div>
                            <h4 className="font-medium">
                              {approval.workflow_instance?.instance_name || 'Workflow Request'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Step {approval.step_number} • {approval.workflow_instance?.entity_type}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Initiated by: {approval.workflow_instance?.initiated_by}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => setSelectedApproval(approval)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
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
            {selectedApproval ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">
                    {selectedApproval.workflow_instance?.instance_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Entity Type:</span>
                      <p>{selectedApproval.workflow_instance?.entity_type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant="outline">
                        {selectedApproval.workflow_instance?.workflow_status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Step:</span>
                      <p>{selectedApproval.step_number}</p>
                    </div>
                    <div>
                      <span className="font-medium">Initiated:</span>
                      <p>{new Date(selectedApproval.workflow_instance?.initiated_at || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApproval(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => approveWorkflowMutation.mutate({
                      approvalId: selectedApproval.id,
                      decision: 'rejected'
                    })}
                    disabled={approveWorkflowMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveWorkflowMutation.mutate({
                      approvalId: selectedApproval.id,
                      decision: 'approved'
                    })}
                    disabled={approveWorkflowMutation.isPending}
                  >
                    {approveWorkflowMutation.isPending ? 'Processing...' : 'Approve'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an approval to review</p>
                <p className="text-sm">Choose from the pending approvals list</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
