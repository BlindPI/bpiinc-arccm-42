
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Workflow, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Plus,
  FileText,
  Shield
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';

interface TeamGovernanceManagerProps {
  teamId: string;
  currentUserRole: string;
}

export function TeamGovernanceManager({ teamId, currentUserRole }: TeamGovernanceManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('approvals');
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals', teamId],
    queryFn: () => enterpriseTeamService.getPendingApprovals(teamId)
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, comments }: { approvalId: string; comments?: string }) =>
      enterpriseTeamService.approveRequest(approvalId, 'current-user-id', comments),
    onSuccess: () => {
      toast.success('Request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', teamId] });
    },
    onError: () => {
      toast.error('Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: string; reason: string }) =>
      enterpriseTeamService.rejectRequest(approvalId, 'current-user-id', reason),
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', teamId] });
    },
    onError: () => {
      toast.error('Failed to reject request');
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApprove = ['OWNER', 'LEAD'].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Team Governance & Workflows
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage approval workflows, policies, and governance rules
          </p>
        </div>
        
        <Button onClick={() => setShowWorkflowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approvals ({pendingApprovals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                  <p>All requests have been processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="capitalize">{approval.request_type?.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">User Name</div>
                            <div className="text-sm text-muted-foreground">user@example.com</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {JSON.stringify(approval.request_data, null, 2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(approval.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(approval.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {canApprove && approval.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate({ approvalId: approval.id })}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectMutation.mutate({ 
                                  approvalId: approval.id, 
                                  reason: 'Rejected by user' 
                                })}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Role Change Approval</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Requires approval for role changes to LEAD or OWNER positions
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Active</Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Team Archival Workflow</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Multi-step approval process for team archival requests
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Active</Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Budget Approval</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Approval required for budget changes above threshold
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Governance Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Member Addition Policy</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    All new member additions require approval from team lead or owner
                  </p>
                  <Badge className="bg-green-100 text-green-800">Enforced</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Data Export Restrictions</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Team data exports require approval and audit logging
                  </p>
                  <Badge className="bg-green-100 text-green-800">Enforced</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Delegation Rules</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permission delegation allowed with time limits and approval
                  </p>
                  <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Modal */}
      <Dialog open={showWorkflowModal} onOpenChange={setShowWorkflowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Approval Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Workflow Name</Label>
              <Input placeholder="e.g., Role Change Approval" className="mt-1" />
            </div>
            
            <div>
              <Label>Trigger Conditions</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role_change">Role Change</SelectItem>
                  <SelectItem value="member_removal">Member Removal</SelectItem>
                  <SelectItem value="team_archival">Team Archival</SelectItem>
                  <SelectItem value="budget_change">Budget Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Required Approvers</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select approver role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Team Owner</SelectItem>
                  <SelectItem value="LEAD">Team Lead</SelectItem>
                  <SelectItem value="ADMIN">Team Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe when this workflow should be triggered..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWorkflowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowWorkflowModal(false)}>
                Create Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
