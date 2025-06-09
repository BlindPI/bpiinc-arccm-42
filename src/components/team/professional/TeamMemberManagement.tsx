
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEnterpriseTeamService } from '@/services/team/realEnterpriseTeamService';
import { MemberInvitationModal } from './MemberInvitationModal';
import { RealMemberTable } from '../functional/RealMemberTable';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';
import { toast } from 'sonner';
import { Users, UserPlus, Search } from 'lucide-react';

interface TeamMemberManagementProps {
  team: EnhancedTeam;
  userRole?: string;
}

export function TeamMemberManagement({ team, userRole }: TeamMemberManagementProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const canManage = ['SA', 'AD'].includes(userRole || '');

  // Fetch team members with proper type conversion
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['team-members', team.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            email,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('team_id', team.id);

      if (error) throw error;

      // Convert to proper TeamMemberWithProfile format
      return (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: member.permissions || {},
        created_at: member.created_at,
        updated_at: member.updated_at,
        last_activity: member.last_activity,
        display_name: member.profiles?.display_name || 'Unknown User',
        profiles: {
          id: member.profiles.id,
          display_name: member.profiles.display_name,
          email: member.profiles.email,
          role: member.profiles.role,
          created_at: member.profiles.created_at,
          updated_at: member.profiles.updated_at
        }
      })) as TeamMemberWithProfile[];
    },
    refetchInterval: 30000
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'MEMBER' | 'ADMIN' }) => {
      return RealEnterpriseTeamService.addTeamMember(team.id, userId, role);
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
    },
    onError: (error) => {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return RealEnterpriseTeamService.removeTeamMember(team.id, memberId);
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'MEMBER' | 'ADMIN' }) => {
      return RealEnterpriseTeamService.updateTeamMemberRole(team.id, memberId, newRole);
    },
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    }
  });

  const handleAddMembers = () => {
    // Refresh the members list after adding
    queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
    setShowInviteModal(false);
  };

  const filteredMembers = members.filter(member =>
    member.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading team members</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['team-members', team.id] })}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </h2>
          <p className="text-muted-foreground">
            Manage team membership and roles for {team.name}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Members
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.profiles?.display_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {member.profiles?.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRoleMutation.mutate({
                      memberId: member.id,
                      newRole: member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                    })}
                    disabled={updateRoleMutation.isPending}
                  >
                    {member.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    disabled={removeMemberMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No members found matching your search' : 'No members in this team'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Members Modal */}
      {showInviteModal && (
        <MemberInvitationModal
          teamId={team.id}
          teamName={team.name}
          onClose={() => setShowInviteModal(false)}
          onMembersAdded={handleAddMembers}
        />
      )}
    </div>
  );
}
