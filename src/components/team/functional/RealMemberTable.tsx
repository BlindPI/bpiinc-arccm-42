
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realTeamDataService, type TeamMemberWithProfile } from '@/services/team/realTeamDataService';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { toast } from 'sonner';
import { 
  Users, 
  MoreVertical, 
  Edit3, 
  UserMinus, 
  Search,
  Crown,
  Shield,
  User,
  MapPin,
  Mail,
  Clock,
  UserPlus
} from 'lucide-react';

interface RealMemberTableProps {
  teamId: string;
  teamName: string;
}

export function RealMemberTable({ teamId, teamName }: RealMemberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => realTeamDataService.getTeamMembers(teamId),
    enabled: !!teamId
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, updates }: { memberId: string; updates: any }) =>
      realTeamDataService.updateTeamMember(memberId, updates),
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
    },
    onError: (error) => {
      toast.error('Failed to update member');
      console.error('Update member error:', error);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => realTeamDataService.removeTeamMember(memberId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
    },
    onError: (error) => {
      toast.error('Failed to remove member');
      console.error('Remove member error:', error);
    }
  });

  const filteredMembers = members.filter(member =>
    member.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.team_position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'OWNER':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const handlePromoteToAdmin = (memberId: string) => {
    updateMemberMutation.mutate({
      memberId,
      updates: {
        role: 'ADMIN',
        permissions: { admin: true, manage_members: true }
      }
    });
  };

  const handleDemoteToMember = (memberId: string) => {
    updateMemberMutation.mutate({
      memberId,
      updates: {
        role: 'MEMBER',
        permissions: {}
      }
    });
  };

  const handleStatusChange = (memberId: string, newStatus: string) => {
    updateMemberMutation.mutate({
      memberId,
      updates: { status: newStatus }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Error Loading Members</h3>
          <p className="text-muted-foreground">Failed to load team members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {teamName} Members ({filteredMembers.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{member.display_name}</h3>
                        {getRoleIcon(member.role)}
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(member.status || 'active')}`}>
                          {member.status || 'active'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {member.profile?.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.profile.email}
                          </div>
                        )}
                        
                        {member.team_position && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {member.team_position}
                          </div>
                        )}
                        
                        {member.assignment_start_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Joined: {formatDate(member.assignment_start_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                      {member.role === 'MEMBER' ? (
                        <DropdownMenuItem onClick={() => handlePromoteToAdmin(member.id)}>
                          <Crown className="h-4 w-4 mr-2" />
                          Promote to Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleDemoteToMember(member.id)}>
                          <User className="h-4 w-4 mr-2" />
                          Demote to Member
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
                      
                      {member.status !== 'active' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')}>
                          Activate Member
                        </DropdownMenuItem>
                      )}
                      {member.status !== 'inactive' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'inactive')}>
                          Deactivate Member
                        </DropdownMenuItem>
                      )}
                      {member.status !== 'suspended' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'suspended')}>
                          Suspend Member
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <AddTeamMemberModal
          teamId={teamId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
