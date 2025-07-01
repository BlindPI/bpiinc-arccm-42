
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Crown, 
  Shield, 
  Users, 
  Settings, 
  Eye,
  UserCog,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';

type EnterpriseTeamRole = 'OWNER' | 'LEAD' | 'ADMIN' | 'MEMBER' | 'OBSERVER';

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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: EnterpriseTeamRole }) =>
      EnterpriseTeamService.updateMemberRole(teamId, memberId, newRole, 'current-user-id'),
    onSuccess: (result: any) => {
      if (result && typeof result === 'object' && 'requiresApproval' in result && result.requiresApproval) {
        toast.info('Role change submitted for approval');
      } else {
        toast.success('Role updated successfully');
      }
      onMemberUpdated();
      setShowRoleModal(false);
    },
    onError: () => {
      toast.error('Failed to update role');
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ updates }: { updates: Array<{ memberId: string; newRole: EnterpriseTeamRole }> }) =>
      EnterpriseTeamService.bulkUpdateMemberRoles(teamId, updates, 'current-user-id'),
    onSuccess: (result: any) => {
      if (result && typeof result === 'object' && 'processed' in result && 'requiresApproval' in result) {
        toast.success(`Updated ${result.processed} members. ${result.requiresApproval.length} pending approval.`);
      } else {
        toast.success('Bulk update completed');
      }
      onMemberUpdated();
      setSelectedMembers([]);
    },
    onError: () => {
      toast.error('Failed to update roles');
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'LEAD': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'ADMIN': return <UserCog className="h-4 w-4 text-purple-500" />;
      case 'MEMBER': return <Users className="h-4 w-4 text-green-500" />;
      case 'OBSERVER': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4" />;
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

  const canUpdateRole = (targetRole: EnterpriseTeamRole) => {
    return ['OWNER', 'LEAD', 'ADMIN'].includes(currentUserRole);
  };

  const handleBulkUpdate = () => {
    const updates = selectedMembers.map(memberId => ({
      memberId,
      newRole: bulkRole
    }));
    
    bulkUpdateMutation.mutate({ updates });
  };

  const handleSingleRoleUpdate = (newRole: EnterpriseTeamRole) => {
    if (selectedMember) {
      updateRoleMutation.mutate({
        memberId: selectedMember.id,
        newRole
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Enterprise Role Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage team member roles with granular permissions and approval workflows
          </p>
        </div>
        
        {selectedMembers.length > 0 && (
          <div className="flex items-center gap-2">
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
            <Button onClick={handleBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              Update {selectedMembers.length} Members
            </Button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
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
                </TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.display_name}</div>
                      <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(member.role)}
                      {member.role || 'MEMBER'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>• View Members</div>
                      {['ADMIN', 'LEAD', 'OWNER'].includes(member.role) && <div>• Manage Team</div>}
                      {['LEAD', 'OWNER'].includes(member.role) && <div>• Advanced Reports</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Active</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog open={showRoleModal && selectedMember?.id === member.id} onOpenChange={setShowRoleModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                          disabled={!canUpdateRole(member.role)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Update Role: {member.display_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Current Role</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {getRoleIcon(member.role)}
                              <span>{member.role || 'MEMBER'}</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label>New Role</Label>
                            <Select onValueChange={handleSingleRoleUpdate}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select new role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OWNER">Owner</SelectItem>
                                <SelectItem value="LEAD">Lead</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="OBSERVER">Observer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="bg-yellow-50 p-3 rounded-md">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Note</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              Role changes may require approval based on team governance rules.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['OWNER', 'LEAD', 'ADMIN', 'MEMBER', 'OBSERVER'].map((role) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getRoleIcon(role)}
                  <h4 className="font-medium">{role}</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div>• View team members</div>
                  {['ADMIN', 'LEAD', 'OWNER'].includes(role) && <div>• Manage members</div>}
                  {['LEAD', 'OWNER'].includes(role) && <div>• Team settings</div>}
                  {role === 'OWNER' && <div>• Full control</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
