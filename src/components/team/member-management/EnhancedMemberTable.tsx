
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  UserMinus,
  Shield,
  Activity
} from 'lucide-react';
import { RealEnterpriseTeamService, TeamMemberWithProfile } from '@/services/team/realEnterpriseTeamService';
import { UserActivityService } from '@/services/team/userActivityService';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export interface EnhancedMemberTableProps {
  teamId: string;
  userRole: string;
  onSelectionChange: (memberIds: string[]) => void;
  selectedMembers: string[];
}

export function EnhancedMemberTable({ 
  teamId, 
  userRole, 
  onSelectionChange, 
  selectedMembers 
}: EnhancedMemberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editMember, setEditMember] = useState<TeamMemberWithProfile | null>(null);
  const [permissionsMember, setPermissionsMember] = useState<TeamMemberWithProfile | null>(null);
  const [activityMember, setActivityMember] = useState<TeamMemberWithProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => RealEnterpriseTeamService.getTeamMembers(teamId)
  });

  // Get enhanced activity data for members
  const { data: activityData = {} } = useQuery({
    queryKey: ['member-activity', members.map(m => m.user_id)],
    queryFn: () => UserActivityService.getBulkUserActivity(members.map(m => m.user_id)),
    enabled: members.length > 0
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: string }) =>
      RealEnterpriseTeamService.updateMemberRole(memberId, newRole),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => RealEnterpriseTeamService.removeMember(memberId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.profiles.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredMembers.map(m => m.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedMembers, memberId]);
    } else {
      onSelectionChange(selectedMembers.filter(id => id !== memberId));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'MEMBER': return 'secondary';
      case 'VIEWER': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({filteredMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Members Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{member.profiles.display_name}</span>
                    <span className="text-sm text-muted-foreground">{member.profiles.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(member.status)}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(member.joined_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {activityData[member.user_id]?.lastLogin ? 
                    new Date(activityData[member.user_id].lastLogin).toLocaleDateString() : 
                    (member.last_activity ? new Date(member.last_activity).toLocaleDateString() : 'Never')
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditMember(member)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPermissionsMember(member)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActivityMember(member)}>
                        <Activity className="h-4 w-4 mr-2" />
                        View Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
      </CardContent>

      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Details</DialogTitle>
            <DialogDescription>
              Update member information for {editMember?.profiles.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {editMember?.role || 'Select Role'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem 
                    onClick={() => editMember && updateRoleMutation.mutate({ 
                      memberId: editMember.id, 
                      newRole: 'ADMIN' 
                    })}
                  >
                    ADMIN
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => editMember && updateRoleMutation.mutate({ 
                      memberId: editMember.id, 
                      newRole: 'MEMBER' 
                    })}
                  >
                    MEMBER
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => editMember && updateRoleMutation.mutate({ 
                      memberId: editMember.id, 
                      newRole: 'VIEWER' 
                    })}
                  >
                    VIEWER
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditMember(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditMember(null)}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={!!permissionsMember} onOpenChange={() => setPermissionsMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {permissionsMember?.profiles.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Team Permissions</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span className="text-sm">View Team</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Edit Team</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Manage Members</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Content Permissions</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span className="text-sm">View Content</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Create Content</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Delete Content</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPermissionsMember(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Permissions updated successfully');
                setPermissionsMember(null);
              }}>
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={!!activityMember} onOpenChange={() => setActivityMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Activity</DialogTitle>
            <DialogDescription>
              Recent activity for {activityMember?.profiles.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Activity className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Joined team</p>
                  <p className="text-xs text-muted-foreground">
                    {activityMember && new Date(activityMember.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Role assigned: {activityMember?.role}</p>
                  <p className="text-xs text-muted-foreground">System generated</p>
                </div>
              </div>
              {activityMember && activityData[activityMember.user_id] && (
                <>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Last login</p>
                      <p className="text-xs text-muted-foreground">
                        {activityData[activityMember.user_id].lastLogin 
                          ? new Date(activityData[activityMember.user_id].lastLogin!).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Total sessions: {activityData[activityMember.user_id].loginCount}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg duration: {activityData[activityMember.user_id].activitySummary.averageSessionDuration}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setActivityMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
