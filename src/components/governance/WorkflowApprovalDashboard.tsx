
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Users, TrendingUp } from 'lucide-react';
import { WorkflowAutomationService } from '@/services/governance/workflowAutomationService';
import { toast } from 'sonner';

export function WorkflowApprovalDashboard() {
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');

  const { data: pendingApprovals = [], isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => WorkflowAutomationService.getPendingApprovals('current-user-id') // Would use actual user ID
  });

  const { data: workflowMetrics } = useQuery({
    queryKey: ['workflow-metrics'],
    queryFn: () => WorkflowAutomationService.getWorkflowMetrics(),
    refetchInterval: 30000
  });

  const { data: recentInstances = [] } = useQuery({
    queryKey: ['recent-workflow-instances'],
    queryFn: () => WorkflowAutomationService.getWorkflowInstances()
  });

  const processApprovalMutation = useMutation({
    mutationFn: ({ approvalId, action, comments }: { 
      approvalId: string; 
      action: 'approved' | 'rejected'; 
      comments?: string 
    }) =>
      WorkflowAutomationService.processApproval(approvalId, action, comments),
    onSuccess: () => {
      toast.success('Approval processed successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-metrics'] });
      setShowApprovalDialog(false);
      setComments('');
    },
    onError: () => {
      toast.error('Failed to process approval');
    }
  });

  const handleApprovalAction = (approval: any, action: 'approved' | 'rejected') => {
    setSelectedApproval(approval);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const submitApproval = () => {
    if (!selectedApproval) return;
    
    processApprovalMutation.mutate({
      approvalId: selectedApproval.id,
      action: approvalAction,
      comments: comments.trim() || undefined
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
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
          Review and approve pending workflow requests
        </p>
      </div>

      {/* Metrics Overview */}
      {workflowMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{workflowMetrics.pending}</p>
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
                  <p className="text-2xl font-bold">{workflowMetrics.approved}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escalated</p>
                  <p className="text-2xl font-bold">{workflowMetrics.escalated}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SLA Breaches</p>
                  <p className="text-2xl font-bold">{workflowMetrics.slaBreaches}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent Workflows
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className={`${isOverdue(approval.workflow_instance?.sla_deadline) ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(approval.workflow_instance?.workflow_status)}
                        <div>
                          <h3 className="font-semibold">{approval.workflow_instance?.instance_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {approval.workflow_instance?.entity_type} • 
                            Step {approval.step_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isOverdue(approval.workflow_instance?.sla_deadline) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        <Badge className={getStatusColor(approval.workflow_instance?.workflow_status)}>
                          {approval.workflow_instance?.workflow_status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Initiated:</span>
                        <p>{new Date(approval.workflow_instance?.initiated_at).toLocaleDateString()}</p>
                      </div>
                      {approval.workflow_instance?.sla_deadline && (
                        <div>
                          <span className="text-muted-foreground">SLA Deadline:</span>
                          <p className={isOverdue(approval.workflow_instance?.sla_deadline) ? 'text-red-600 font-medium' : ''}>
                            {new Date(approval.workflow_instance?.sla_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprovalAction(approval, 'approved')}
                        disabled={processApprovalMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApprovalAction(approval, 'rejected')}
                        disabled={processApprovalMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInstances.slice(0, 10).map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(instance.workflow_status)}
                      <div>
                        <p className="font-medium text-sm">{instance.instance_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {instance.entity_type} • {new Date(instance.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(instance.workflow_status)}>
                      {instance.workflow_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Processing Time</span>
                    <span className="font-semibold">{workflowMetrics?.avgProcessingTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Rate</span>
                    <span className="font-semibold">{workflowMetrics?.complianceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SLA Adherence</span>
                    <span className="font-semibold">96.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Workflow Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Team Management</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Certificate Requests</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Provider Approvals</span>
                    <span className="font-semibold">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approved' ? 'Approve' : 'Reject'} Workflow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedApproval?.workflow_instance?.instance_name}
              </p>
              <p className="text-sm">
                Are you sure you want to {approvalAction === 'approved' ? 'approve' : 'reject'} this workflow request?
              </p>
            </div>
            
            <div>
              <Label htmlFor="comments">Comments {approvalAction === 'rejected' ? '(Required)' : '(Optional)'}</Label>
              <Textarea
                id="comments"
                placeholder={`Add ${approvalAction === 'approved' ? 'approval' : 'rejection'} comments...`}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitApproval}
                disabled={processApprovalMutation.isPending || (approvalAction === 'rejected' && !comments.trim())}
                variant={approvalAction === 'approved' ? 'default' : 'destructive'}
              >
                {processApprovalMutation.isPending ? 'Processing...' : 
                 approvalAction === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
