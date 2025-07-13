import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  ArrowLeftRight, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { 
  AdvancedBulkOperationsService, 
  MemberBulkUpdate, 
  CrossTeamTransfer, 
  WorkflowApprovalRequest 
} from '@/services/team/advancedBulkOperationsService';

interface AdvancedBulkOperationsPanelProps {
  teamId: string;
  teamName: string;
  userRole: string;
}

export function AdvancedBulkOperationsPanel({ teamId, teamName, userRole }: AdvancedBulkOperationsPanelProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkUpdateData, setBulkUpdateData] = useState<MemberBulkUpdate[]>([]);
  const [transferData, setTransferData] = useState<Partial<CrossTeamTransfer>>({});
  const [workflowRequest, setWorkflowRequest] = useState<Partial<WorkflowApprovalRequest>>({});
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('json');
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch team members for bulk operations
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      // Mock team members data - replace with actual service call
      return [
        { user_id: '1', display_name: 'John Doe', role: 'MEMBER', status: 'active' },
        { user_id: '2', display_name: 'Jane Smith', role: 'ADMIN', status: 'active' },
        { user_id: '3', display_name: 'Mike Johnson', role: 'MEMBER', status: 'inactive' }
      ];
    }
  });

  // Fetch available teams for transfers
  const { data: availableTeams } = useQuery({
    queryKey: ['available-teams'],
    queryFn: async () => {
      // Mock teams data - replace with actual service call
      return [
        { id: 'team-1', name: 'Development Team' },
        { id: 'team-2', name: 'Design Team' },
        { id: 'team-3', name: 'Marketing Team' }
      ];
    }
  });

  // Fetch pending workflow approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => AdvancedBulkOperationsService.getPendingWorkflowApprovals(),
    enabled: userRole === 'SA' || userRole === 'AD'
  });

  // Bulk member operations mutation
  const bulkOperationsMutation = useMutation({
    mutationFn: (operations: MemberBulkUpdate[]) => 
      AdvancedBulkOperationsService.performBulkMemberOperations(teamId, operations),
    onSuccess: (result) => {
      toast({
        title: "Bulk Operation Complete",
        description: `Processed ${result.processed_count} members successfully. ${result.failed_count} failed.`,
        variant: result.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      setSelectedMembers([]);
      setBulkUpdateData([]);
    },
    onError: (error) => {
      toast({
        title: "Bulk Operation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Cross-team transfer mutation
  const transferMutation = useMutation({
    mutationFn: (transfer: CrossTeamTransfer) => 
      AdvancedBulkOperationsService.executeCrossTeamTransfer(transfer),
    onSuccess: (result) => {
      toast({
        title: "Transfer Complete",
        description: `Transferred ${result.processed_count} members successfully.`,
        variant: result.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setTransferData({});
      setSelectedMembers([]);
    }
  });

  // Workflow approval submission mutation
  const workflowMutation = useMutation({
    mutationFn: (request: WorkflowApprovalRequest) => 
      AdvancedBulkOperationsService.submitWorkflowApproval(request),
    onSuccess: () => {
      toast({
        title: "Workflow Submitted",
        description: "Your request has been submitted for approval.",
      });
      setWorkflowRequest({});
    }
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: ({ format, includeAnalytics }: { format: string, includeAnalytics: boolean }) => 
      AdvancedBulkOperationsService.exportTeamData([teamId], format as any, true, includeAnalytics),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-${teamId}-export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Team data exported successfully as ${exportFormat.toUpperCase()}.`,
      });
    }
  });

  const handleMemberSelection = (memberId: string, selected: boolean) => {
    if (selected) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleBulkRoleUpdate = (newRole: 'ADMIN' | 'MEMBER') => {
    const updates: MemberBulkUpdate[] = selectedMembers.map(userId => ({
      user_id: userId,
      updates: { role: newRole }
    }));
    setBulkUpdateData(updates);
    bulkOperationsMutation.mutate(updates);
  };

  const handleCrossTeamTransfer = () => {
    if (!transferData.target_team_id || selectedMembers.length === 0) {
      toast({
        title: "Transfer Error",
        description: "Please select target team and members to transfer.",
        variant: "destructive"
      });
      return;
    }

    const transfer: CrossTeamTransfer = {
      user_ids: selectedMembers,
      source_team_id: teamId,
      target_team_id: transferData.target_team_id!,
      preserve_role: transferData.preserve_role || false,
      effective_date: transferData.effective_date || new Date().toISOString().split('T')[0]
    };

    transferMutation.mutate(transfer);
  };

  const handleWorkflowSubmission = () => {
    if (!workflowRequest.request_type || !workflowRequest.business_justification) {
      toast({
        title: "Workflow Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const request: WorkflowApprovalRequest = {
      request_type: workflowRequest.request_type!,
      requested_by: 'current-user-id', // Replace with actual user ID
      team_id: teamId,
      request_data: { selected_members: selectedMembers, ...workflowRequest.request_data },
      business_justification: workflowRequest.business_justification!,
      urgency_level: workflowRequest.urgency_level || 'medium'
    };

    workflowMutation.mutate(request);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive',
      'active': 'default',
      'inactive': 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (membersLoading) {
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
          <h2 className="text-2xl font-bold">Advanced Bulk Operations</h2>
          <p className="text-muted-foreground">{teamName} - Manage team members and operations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => exportMutation.mutate({ format: exportFormat, includeAnalytics })}
            variant="outline"
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="bulk-operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
          <TabsTrigger value="transfers">Cross-Team Transfers</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Approvals</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk-operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Team Members</CardTitle>
                <CardDescription>Choose members for bulk operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {teamMembers?.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          onCheckedChange={(checked) => handleMemberSelection(member.user_id, checked as boolean)}
                        />
                        <div>
                          <p className="font-medium">{member.display_name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      {getStatusBadge(member.status)}
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Perform operations on selected members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleBulkRoleUpdate('ADMIN')}
                    disabled={selectedMembers.length === 0 || bulkOperationsMutation.isPending}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Promote to Admin
                  </Button>
                  
                  <Button
                    onClick={() => handleBulkRoleUpdate('MEMBER')}
                    disabled={selectedMembers.length === 0 || bulkOperationsMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Set as Member
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        disabled={selectedMembers.length === 0}
                        variant="outline"
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Advanced Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Advanced Member Update</DialogTitle>
                        <DialogDescription>
                          Update multiple properties for selected members
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Role</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Team Position</Label>
                          <Input placeholder="e.g., Senior Developer, Lead Instructor" />
                        </div>
                        <div>
                          <Label>Assignment Start Date</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button>Apply Updates</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {bulkOperationsMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={66} />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing bulk operation...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cross-Team Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Team Member Transfer</CardTitle>
              <CardDescription>Transfer selected members to another team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Team</Label>
                  <Select onValueChange={(value) => setTransferData(prev => ({ ...prev, target_team_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Effective Date</Label>
                  <Input 
                    type="date" 
                    onChange={(e) => setTransferData(prev => ({ ...prev, effective_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserve-role"
                  checked={transferData.preserve_role || false}
                  onCheckedChange={(checked) => setTransferData(prev => ({ ...prev, preserve_role: checked as boolean }))}
                />
                <Label htmlFor="preserve-role">Preserve current roles in target team</Label>
              </div>

              <Button
                onClick={handleCrossTeamTransfer}
                disabled={selectedMembers.length === 0 || !transferData.target_team_id || transferMutation.isPending}
                className="w-full"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Transfer {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
              </Button>

              {transferMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={33} />
                  <p className="text-sm text-muted-foreground text-center">
                    Processing transfer...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Approvals Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit New Workflow */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Workflow Request</CardTitle>
                <CardDescription>Request approval for sensitive operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Request Type</Label>
                  <Select onValueChange={(value) => setWorkflowRequest(prev => ({ ...prev, request_type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member_bulk_update">Bulk Member Update</SelectItem>
                      <SelectItem value="cross_team_transfer">Cross-Team Transfer</SelectItem>
                      <SelectItem value="team_archival">Team Archival</SelectItem>
                      <SelectItem value="team_creation">Team Creation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Urgency Level</Label>
                  <Select onValueChange={(value) => setWorkflowRequest(prev => ({ ...prev, urgency_level: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Business Justification</Label>
                  <Textarea
                    placeholder="Explain the business need for this operation..."
                    onChange={(e) => setWorkflowRequest(prev => ({ ...prev, business_justification: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleWorkflowSubmission}
                  disabled={!workflowRequest.request_type || !workflowRequest.business_justification || workflowMutation.isPending}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </CardContent>
            </Card>

            {/* Pending Approvals (Admin Only) */}
            {(userRole === 'SA' || userRole === 'AD') && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Review and approve workflow requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {approvalsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingApprovals?.map((approval) => (
                        <div key={approval.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{approval.request_type.replace('_', ' ')}</span>
                            {getStatusBadge(approval.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {approval.profiles?.display_name}
                          </p>
                          <p className="text-sm">
                            {approval.request_data?.business_justification}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!pendingApprovals || pendingApprovals.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No pending approvals
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Team Data</CardTitle>
              <CardDescription>Export comprehensive team information and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="include-analytics"
                    checked={includeAnalytics}
                    onCheckedChange={(checked) => setIncludeAnalytics(checked as boolean)}
                  />
                  <Label htmlFor="include-analytics">Include analytics data</Label>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Export will include:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Team basic information and settings</li>
                  <li>• All team members and their roles</li>
                  <li>• Member contact information and profiles</li>
                  {includeAnalytics && <li>• Performance analytics and metrics</li>}
                  {includeAnalytics && <li>• Historical trend data</li>}
                </ul>
              </div>

              <Button
                onClick={() => exportMutation.mutate({ format: exportFormat, includeAnalytics })}
                disabled={exportMutation.isPending}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Team Data
              </Button>

              {exportMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={50} />
                  <p className="text-sm text-muted-foreground text-center">
                    Preparing export...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}