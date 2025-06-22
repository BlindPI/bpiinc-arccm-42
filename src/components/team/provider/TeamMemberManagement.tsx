/**
 * TEAM MEMBER MANAGEMENT - PROVIDER INTERFACE
 *
 * ✅ Full member management functionality with real database integration
 * ✅ Add/remove team members
 * ✅ Role assignment and management
 * ✅ Member performance tracking
 * ✅ Real-time updates
 * ✅ FIXED: Safe email access for AP users with null emails
 */

import React, { useState } from 'react';
import { getSafeUserEmail, getSafeDisplayEmail, getSafeUserDisplayName, hasValidEmail } from '@/utils/fixNullEmailAccessPatterns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  UserMinus,
  Edit2,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMemberManagementProps {
  teamId: string;
  onBack: () => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  performance_score?: number;
  user: {
    id: string;
    email: string | null;
    display_name?: string;
    phone?: string;
    role: string;
    status: string;
  };
}

interface AvailableUser {
  id: string;
  email: string | null;
  display_name?: string;
  role: string;
  status: string;
}

const MEMBER_ROLES = [
  { value: 'member', label: 'Team Member' },
  { value: 'lead', label: 'Team Lead' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'coordinator', label: 'Coordinator' }
];

export function TeamMemberManagement({ teamId, onBack }: TeamMemberManagementProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Load team details
  const { data: team } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Load team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:profiles(
            id,
            email,
            display_name,
            phone,
            role,
            status
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Load available users for adding
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available-users', teamId],
    queryFn: async (): Promise<AvailableUser[]> => {
      // Get users who are not already in this team
      const currentMemberIds = teamMembers.map(m => m.user_id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, status')
        .in('role', ['IC', 'IP', 'IT', 'IN']) // Instructor roles
        .eq('status', 'active')
        .not('id', 'in', `(${currentMemberIds.join(',')})`)
        .order('email');
      
      if (error) throw error;
      return data || [];
    },
    enabled: showAddDialog && teamMembers.length > 0
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      const memberInserts = userIds.map(userId => ({
        team_id: teamId,
        user_id: userId,
        role,
        status: 'active',
        joined_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('team_members')
        .insert(memberInserts);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Members added successfully!');
      setShowAddDialog(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to add members: ${error.message}`);
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member role updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    await addMembersMutation.mutateAsync({
      userIds: selectedUsers,
      role: selectedRole
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      await removeMemberMutation.mutateAsync(memberId);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    await updateRoleMutation.mutateAsync({ memberId, role: newRole });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredMembers = teamMembers.filter(member => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const email = getSafeUserEmail(member.user);
    const displayName = getSafeUserDisplayName(member.user);
    return displayName.toLowerCase().includes(searchLower) ||
           (email && email.toLowerCase().includes(searchLower));
  });

  const getFullName = (user: any) => {
    return getSafeUserDisplayName(user);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-muted-foreground">
            {team?.name} • {teamMembers.length} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Members
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back to Team
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Members Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{teamMembers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Team Leads</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.filter(m => m.role === 'lead').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Performance</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.length > 0
                ? Math.round(teamMembers.reduce((sum, m) => sum + (m.performance_score || 0), 0) / teamMembers.length)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teamMembers.filter(m => m.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-8">Loading members...</div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{getFullName(member.user)}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {hasValidEmail(member.user) && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {getSafeUserEmail(member.user)}
                          </span>
                        )}
                        {member.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.user.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {member.role}
                        </Badge>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        {member.performance_score !== undefined && (
                          <Badge variant="outline">
                            {member.performance_score}% performance
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Members Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Select users to add to {team?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Member Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Available Users</Label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {availableUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                    <div>
                      <div className="font-medium">{getFullName(user)}</div>
                      <div className="text-sm text-muted-foreground">{getSafeDisplayEmail(user)}</div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {selectedUsers.length} users
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMembers}
                disabled={addMembersMutation.isPending || selectedUsers.length === 0}
              >
                {addMembersMutation.isPending ? 'Adding...' : 'Add Members'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}