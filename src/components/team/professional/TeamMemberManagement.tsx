
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  UserMinus,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RealEnterpriseTeamService } from '@/services/team/realEnterpriseTeamService';
import type { EnhancedTeam } from '@/types/team-management';
import { MemberInvitationModal } from './MemberInvitationModal';

interface TeamMemberManagementProps {
  team: EnhancedTeam;
  canManage: boolean;
  userRole?: string;
}

interface TeamMemberDisplay {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended' | 'on_leave';
  user_role: string;
  created_at: string;
}

export function TeamMemberManagement({ team, canManage, userRole }: TeamMemberManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch team members with profiles
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', team.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles(
            id,
            display_name,
            email,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('team_id', team.id)
        .order('created_at');

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        display_name: (member.profiles as any)?.display_name || 'Unknown User',
        email: (member.profiles as any)?.email || '',
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'suspended' | 'on_leave',
        user_role: (member.profiles as any)?.role || '',
        created_at: member.created_at
      })) as TeamMemberDisplay[];
    },
    refetchInterval: 30000
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await RealEnterpriseTeamService.removeTeamMember(team.id, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member: ' + error.message);
    }
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'MEMBER' | 'ADMIN' }) => {
      await RealEnterpriseTeamService.updateTeamMemberRole(team.id, memberId, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update member role: ' + error.message);
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'MEMBER' | 'ADMIN' }) => {
      await RealEnterpriseTeamService.addTeamMember(team.id, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      toast.success('Member added successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to add member: ' + error.message);
    }
  });

  const filteredMembers = members.filter(member =>
    member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      accessorKey: 'display_name' as keyof TeamMemberDisplay,
      header: 'Member',
      cell: ({ row }: any) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {member.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.display_name}</div>
              <div className="text-sm text-muted-foreground">{member.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role' as keyof TeamMemberDisplay,
      header: 'Team Role',
      cell: ({ row }: any) => {
        const member = row.original;
        return (
          <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
            {member.role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'user_role' as keyof TeamMemberDisplay,
      header: 'System Role',
      cell: ({ row }: any) => {
        const member = row.original;
        return (
          <Badge variant="outline">
            {member.user_role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status' as keyof TeamMemberDisplay,
      header: 'Status',
      cell: ({ row }: any) => {
        const member = row.original;
        const statusColor = {
          active: 'default',
          inactive: 'secondary',
          suspended: 'destructive',
          on_leave: 'outline'
        }[member.status] || 'secondary';
        
        return (
          <Badge variant={statusColor as any}>
            {member.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at' as keyof TeamMemberDisplay,
      header: 'Joined',
      cell: ({ row }: any) => {
        const member = row.original;
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(member.created_at).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const member = row.original;
        const isCurrentUser = member.user_id === user?.id;
        const canModify = canManage && !isCurrentUser;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => window.open(`mailto:${member.email}`)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              
              {canModify && (
                <>
                  <DropdownMenuItem
                    onClick={() => updateMemberRoleMutation.mutate({
                      memberId: member.id,
                      newRole: member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                    })}
                    disabled={updateMemberRoleMutation.isPending}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {member.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    className="text-destructive"
                    disabled={removeMemberMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage team membership and roles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {canManage && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {members.filter(m => m.role === 'ADMIN').length}
                </div>
                <div className="text-sm text-muted-foreground">Administrators</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {members.filter(m => m.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {members.filter(m => {
                    const joinDate = new Date(m.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return joinDate > thirtyDaysAgo;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Recent Joins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredMembers}
            searchKey="display_name"
          />
        </CardContent>
      </Card>

      {/* Member Invitation Modal */}
      {showInviteModal && (
        <MemberInvitationModal
          teamId={team.id}
          teamName={team.name}
          onClose={() => setShowInviteModal(false)}
          onMembersAdded={(addedMembers) => {
            // Add members using the mutation
            addedMembers.forEach(member => {
              addMemberMutation.mutate({
                userId: member.user_id,
                role: member.role as 'MEMBER' | 'ADMIN'
              });
            });
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}
