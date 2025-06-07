
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Crown, 
  Users, 
  Shield, 
  Eye, 
  Settings,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';
import type { EnterpriseTeamRole, ENTERPRISE_PERMISSIONS } from '@/types/enterprise-team-roles';

interface EnterpriseRoleManagerProps {
  teamId: string;
  members: any[];
  currentUserRole: string;
  onMemberUpdated: () => void;
}

export function EnterpriseRoleManager({ 
  teamId, 
  members, 
  currentUserRole,
  onMemberUpdated 
}: EnterpriseRoleManagerProps) {
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<EnterpriseTeamRole>('MEMBER');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['team-approvals', teamId],
    queryFn: () => enterpriseTeamService.getPendingApprovals(teamId)
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: EnterpriseTeamRole }) =>
      enterpriseTeamService.updateMemberRole(teamId, memberId, newRole, 'current-user-id'),
    onSuccess: (result) => {
      if (result.requiresApproval) {
        toast.success('Role change request submitted for approval');
      } else {
        toast.success('Role updated successfully');
        onMemberUpdated();
      }
      queryClient.invalidateQueries(['team-approvals', teamId]);
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const bulkRoleChangeMutation = useMutation({
    mutationFn: () => {
      const updates = selectedMembers.map(memberId => ({
        memberId,
        newRole: bulkRole
      }));
      return enterpriseTeamService.bulkUpdateMemberRoles(teamId, updates, 'current-user-id');
    },
    onSuccess: (result) => {
      toast.success(`Processed ${result.processed} role changes. ${result.requiresApproval.length} require approval.`);
      setSelectedMembers([]);
      onMemberUpdated();
      queryClient.invalidateQueries(['team-approvals', teamId]);
    },
    onError: (error) => {
      toast.error(`Failed to update roles: ${error.message}`);
    }
  });

  const approvalMutation = useMutation({
    mutationFn: ({ approvalId, action, comments }: { 
      approvalId: string; 
      action: 'approve' | 'reject'; 
      comments?: string 
    }) => {
      if (action === 'approve') {
        return enterpriseTeamService.approveRequest(approvalId, 'current-user-id', comments);
      } else {
        return enterpriseTeamService.rejectRequest(approvalId, 'current-user-id', comments || 'No reason provided');
      }
    },
    onSuccess: () => {
      toast.success('Approval processed successfully');
      queryClient.invalidateQueries(['team-approvals', teamId]);
      onMemberUpdated();
    },
    onError: (error) => {
      toast.error(`Failed to process approval: ${error.message}`);
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'LEAD': return <Users className="h-4 w-4 text-blue-600" />;
      case 'ADMIN': return <Shield className="h-4 w-4 text-green-600" />;
      case 'MEMBER': return <Users className="h-4 w-4 text-gray-600" />;
      case 'OBSERVER': return <Eye className="h-4 w-4 text-purple-600" />;
      default: return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'LEAD': return 'secondary';
      case 'ADMIN': return 'outline';
      default: return 'secondary';
    }
  };

  const handleRoleChange = (memberId: string, newRole: EnterpriseTeamRole) => {
    roleChangeMutation.mutate({ memberId, newRole });
  };

  const handleBulkRoleChange = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members to update');
      return;
    }
    bulkRoleChangeMutation.mutate();
  };

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const canManageRoles = ['OWNER', 'LEAD', 'ADMIN'].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Role Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enterprise Role Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk Operations */}
          {canManageRoles && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMembers.length === members.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMembers(members.map(m => m.id));
                    } else {
                      setSelectedMembers([]);
                    }
                  }}
                />
                <span className="text-sm">Select All ({selectedMembers.length} selected)</span>
              </div>
              
              <Select value={bulkRole} onValueChange={(value: EnterpriseTeamRole) => setBulkRole(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="OBSERVER">Observer</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleBulkRoleChange}
                disabled={selectedMembers.length === 0 || bulkRoleChangeMutation.isPending}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Update Roles
              </Button>
            </div>
          )}

          {/* Member List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {canManageRoles && (
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberSelection(member.id, checked)}
                    />
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.display_name}</span>
                      <Badge 
                        variant={getRoleBadgeVariant(member.role)}
                        className="flex items-center gap-1"
                      >
                        {getRoleIcon(member.role)}
                        {member.role || 'MEMBER'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                  </div>
                </div>

                {canManageRoles && (
                  <Select 
                    value={member.role || 'MEMBER'} 
                    onValueChange={(value: EnterpriseTeamRole) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="OBSERVER">Observer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium capitalize">{approval.request_type.replace('_', ' ')}</span>
                      <Badge variant="outline" className="ml-2">{approval.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Step {approval.current_step}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label htmlFor="approval-comments">Comments (Optional)</Label>
                          <Textarea id="approval-comments" placeholder="Add any comments..." />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => approvalMutation.mutate({ 
                                approvalId: approval.id, 
                                action: 'approve' 
                              })}
                              disabled={approvalMutation.isPending}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => approvalMutation.mutate({ 
                        approvalId: approval.id, 
                        action: 'reject',
                        comments: 'Rejected' 
                      })}
                      disabled={approvalMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
