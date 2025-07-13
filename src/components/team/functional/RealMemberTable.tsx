
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal,
  UserMinus,
  Settings,
  Mail,
  Phone
} from 'lucide-react';
import { teamMemberService } from '@/services/team/teamMemberService';
import type { TeamMemberWithProfile } from '@/types/team-management';
import { toast } from 'sonner';

interface RealMemberTableProps {
  teamId: string;
  userRole?: string;
}

export function RealMemberTable({ teamId, userRole }: RealMemberTableProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamMemberService.getTeamMembers(teamId),
    refetchInterval: 30000 // Refresh every 30 seconds
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

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'LEAD': return 'default';
      case 'SUPERVISOR': return 'default';
      case 'COORDINATOR': return 'secondary';
      case 'SPECIALIST': return 'secondary';
      case 'MEMBER': return 'secondary';
      case 'TRAINEE': return 'outline';
      case 'OBSERVER': return 'outline';
      case 'CONSULTANT': return 'outline';
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({filteredMembers.length})
          </div>
          {canManageMembers && (
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="LEAD">Lead</SelectItem>
              <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              <SelectItem value="COORDINATOR">Coordinator</SelectItem>
              <SelectItem value="SPECIALIST">Specialist</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="TRAINEE">Trainee</SelectItem>
              <SelectItem value="OBSERVER">Observer</SelectItem>
              <SelectItem value="CONSULTANT">Consultant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Members Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Activity</TableHead>
                {canManageMembers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageMembers ? 6 : 5} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">No members found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
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
                       {member.assignment_start_date 
                         ? new Date(member.assignment_start_date).toLocaleDateString()
                         : new Date(member.created_at).toLocaleDateString()
                       }
                     </TableCell>
                    <TableCell>
                      {member.last_activity 
                        ? new Date(member.last_activity).toLocaleDateString()
                        : 'Never'
                      }
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
                              <SelectItem value="LEAD">Lead</SelectItem>
                              <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                              <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                              <SelectItem value="SPECIALIST">Specialist</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="TRAINEE">Trainee</SelectItem>
                              <SelectItem value="OBSERVER">Observer</SelectItem>
                              <SelectItem value="CONSULTANT">Consultant</SelectItem>
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
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      </CardContent>
    </Card>
  );
}
