import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UnifiedTeamService, TeamMember, User } from '@/services/team/unifiedTeamService';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  UserMinus,
  Search,
  Mail,
  Shield,
  Crown,
  Building2,
  MoreVertical,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMemberManagerProps {
  teamId: string;
  teamName: string;
  canManageMembers: boolean;
}

const MEMBER_ROLES = [
  { value: 'member', label: 'Member', icon: Users },
  { value: 'lead', label: 'Team Lead', icon: Shield },
  { value: 'admin', label: 'Team Admin', icon: Crown }
];

const getRoleIcon = (role: string) => {
  const roleConfig = MEMBER_ROLES.find(r => r.value === role);
  return roleConfig?.icon || Users;
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'destructive';
    case 'lead': return 'default';
    default: return 'secondary';
  }
};

export function TeamMemberManager({ teamId, teamName, canManageMembers }: TeamMemberManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newMemberRole, setNewMemberRole] = useState('member');
  
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: members = [], isLoading: membersLoading, refetch } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => UnifiedTeamService.getTeamMembers(teamId),
    refetchInterval: 30000,
  });

  // Fetch available users (not in team)
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['available-users', teamId],
    queryFn: () => UnifiedTeamService.getAvailableUsers(teamId),
    enabled: showAddDialog,
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await UnifiedTeamService.addMember(teamId, userId, role);
    },
    onSuccess: () => {
      toast.success('Member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
      setSelectedUsers([]);
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to add member: ${error.message}`);
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => UnifiedTeamService.removeMember(teamId, userId),
    onSuccess: () => {
      toast.success('Member removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  // Bulk add members mutation
  const bulkAddMutation = useMutation({
    mutationFn: () => UnifiedTeamService.bulkAddMembers(teamId, selectedUsers),
    onSuccess: () => {
      toast.success(`${selectedUsers.length} members added successfully!`);
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
      setSelectedUsers([]);
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to add members: ${error.message}`);
    }
  });

  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    const displayName = member.profile?.display_name?.toLowerCase() || '';
    const email = member.profile?.email?.toLowerCase() || '';
    return displayName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    if (selectedUsers.length === 1) {
      addMemberMutation.mutate({ userId: selectedUsers[0], role: newMemberRole });
    } else {
      bulkAddMutation.mutate();
    }
  };

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  const getInitials = (displayName?: string) => {
    if (!displayName) return 'U';
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  if (membersLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage members for {teamName}
          </p>
        </div>
        {canManageMembers && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Team Members</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No available users to add</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Users:</label>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {availableUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 hover:bg-muted cursor-pointer ${
                              selectedUsers.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => {
                              setSelectedUsers(prev => 
                                prev.includes(user.id) 
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(user.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">
                                {user.display_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedUsers.length === 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Member Role:</label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEMBER_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <role.icon className="h-4 w-4" />
                                  {role.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddMembers}
                          disabled={selectedUsers.length === 0 || addMemberMutation.isPending || bulkAddMutation.isPending}
                        >
                          {(addMemberMutation.isPending || bulkAddMutation.isPending) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Members List */}
      <Card>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No members found' : 'No team members'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : canManageMembers 
                  ? 'Add members to get started'
                  : 'This team has no members yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(member.profile?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.profile?.display_name}
                        </p>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {MEMBER_ROLES.find(r => r.value === member.role)?.label || member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.profile?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {member.profile?.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                      
                      {canManageMembers && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(
                                member.user_id,
                                member.profile?.display_name || 'Unknown User'
                              )}
                              className="text-destructive"
                              disabled={removeMemberMutation.isPending}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}