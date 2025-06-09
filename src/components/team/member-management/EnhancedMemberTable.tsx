
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMemberService } from '@/services/team/teamMemberService';
import type { TeamMemberWithProfile } from '@/types/team-management';
import { toast } from 'sonner';
import { 
  Search, 
  MoreHorizontal,
  UserMinus,
  Settings,
  Mail,
  Phone,
  Calendar,
  Shield,
  Activity
} from 'lucide-react';

interface EnhancedMemberTableProps {
  teamId: string;
  members: TeamMemberWithProfile[];
  userRole?: string;
  onSelectionChange: (memberIds: string[]) => void;
  selectedMembers: string[];
}

export function EnhancedMemberTable({ 
  teamId, 
  members, 
  userRole, 
  onSelectionChange, 
  selectedMembers 
}: EnhancedMemberTableProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'MEMBER' }) =>
      teamMemberService.updateMemberRole(teamId, userId, newRole),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to update member role');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' | 'on_leave' | 'suspended' }) =>
      teamMemberService.updateMemberStatus(teamId, userId, status),
    onSuccess: () => {
      toast.success('Member status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to update member status');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      teamMemberService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to remove member');
    }
  });

  // Advanced filtering and sorting
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      const matchesSearch = member.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.display_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.profiles?.display_name || a.display_name;
          bValue = b.profiles?.display_name || b.display_name;
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'joined':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'activity':
          aValue = new Date(a.last_activity || a.updated_at);
          bValue = new Date(b.last_activity || b.updated_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [members, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredAndSortedMembers.map(m => m.user_id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectMember = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedMembers, userId]);
    } else {
      onSelectionChange(selectedMembers.filter(id => id !== userId));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'MEMBER': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on_leave': return 'outline';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const canManageMembers = ['SA', 'AD'].includes(userRole || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({filteredAndSortedMembers.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="joined">Join Date</SelectItem>
              <SelectItem value="activity">Last Activity</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Members Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {canManageMembers && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedMembers.length === filteredAndSortedMembers.length && filteredAndSortedMembers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Activity</TableHead>
                {canManageMembers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageMembers ? 8 : 7} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">No members found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    {canManageMembers && (
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          onCheckedChange={(checked) => handleSelectMember(member.user_id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {(member.profiles?.display_name || member.display_name).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.display_name || member.display_name}
                          </p>
                          {member.profiles?.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.profiles.email}
                            </div>
                          )}
                        </div>
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
                      <span className="text-sm">
                        {member.team_position || 'Team Member'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Activity className="h-3 w-3" />
                        {member.last_activity 
                          ? new Date(member.last_activity).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(newRole: 'ADMIN' | 'MEMBER') =>
                              updateRoleMutation.mutate({ userId: member.user_id, newRole })
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={member.status}
                            onValueChange={(status: 'active' | 'inactive' | 'on_leave' | 'suspended') =>
                              updateStatusMutation.mutate({ userId: member.user_id, status })
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="on_leave">On Leave</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMemberMutation.mutate({ userId: member.user_id })}
                            disabled={removeMemberMutation.isPending}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filteredAndSortedMembers.length} of {members.length} members</span>
          {selectedMembers.length > 0 && (
            <Badge variant="outline">
              {selectedMembers.length} selected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
