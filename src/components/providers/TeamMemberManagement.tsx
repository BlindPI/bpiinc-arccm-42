/**
 * TEAM MEMBER MANAGEMENT COMPONENT
 * 
 * For AP users to manage team members within their assigned teams
 * Integrates with the new service methods for team member CRUD operations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Mail,
  Shield,
  Calendar,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMemberManagementProps {
  teamId: string;
  teamName: string;
  providerId: string;
  onClose?: () => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  status: string;
  joined_date: string;
  created_at: string;
  email?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  user_role?: string;
}

interface AddMemberFormData {
  userId: string;
  role: string;
  joinedDate: string;
}

export const TeamMemberManagement: React.FC<TeamMemberManagementProps> = ({
  teamId,
  teamName,
  providerId,
  onClose
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [formData, setFormData] = useState<AddMemberFormData>({
    userId: '',
    role: 'member',
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  // Load team members
  const { 
    data: teamMembers, 
    isLoading: membersLoading, 
    error: membersError,
    refetch: refetchMembers 
  } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => providerRelationshipService.getTeamMembers(teamId),
    refetchInterval: 30000
  });

  // Search for users to add
  const {
    data: searchResults,
    isLoading: searchLoading
  } = useQuery({
    queryKey: ['user-search', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, display_name')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);
        
      if (error) throw error;
      return data || [];
    },
    enabled: searchEmail.length >= 3
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberFormData) => {
      return await providerRelationshipService.addTeamMember(
        teamId, 
        data.userId, 
        data.role
      );
    },
    onSuccess: () => {
      toast.success('Team member added successfully');
      setShowAddDialog(false);
      setFormData({
        userId: '',
        role: 'member',
        joinedDate: new Date().toISOString().split('T')[0]
      });
      setSearchEmail('');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      // Also refresh the team assignment data to update member counts
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', providerId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to add team member: ${error.message}`);
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await providerRelationshipService.removeTeamMember(teamId, userId);
    },
    onSuccess: () => {
      toast.success('Team member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', providerId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    }
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      return await providerRelationshipService.updateTeamMemberRole(teamId, userId, newRole);
    },
    onSuccess: () => {
      toast.success('Team member role updated successfully');
      setShowEditDialog(false);
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update member role: ${error.message}`);
    }
  });

  const handleAddMember = async () => {
    if (!formData.userId) {
      toast.error('Please select a user');
      return;
    }

    await addMemberMutation.mutateAsync(formData);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    const memberName = member?.email || member?.display_name || 'this member';
    if (confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      await removeMemberMutation.mutateAsync(member.user_id);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditDialog(true);
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!editingMember) return;
    
    await updateRoleMutation.mutateAsync({
      userId: editingMember.user_id,
      newRole
    });
  };

  const handleRefresh = async () => {
    await refetchMembers();
    toast.success('Team members refreshed');
  };

  if (membersLoading && !teamMembers) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load team members. Please try refreshing.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Member Management</h2>
          <p className="text-muted-foreground">Managing members for: {teamName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={membersLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${membersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">
                  {teamMembers?.filter(m => m.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">
                  {teamMembers?.filter(m => m.role === 'admin' || m.role === 'lead').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
            <Badge variant="outline">{teamMembers?.length || 0}</Badge>
          </CardTitle>
          <CardDescription>
            Manage team member roles and access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers && teamMembers.length > 0 ? (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h4 className="font-medium">
                          {member?.display_name || member?.email || 'Unknown User'}
                        </h4>
                        {member?.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      <Badge variant="outline">
                        {member.role}
                      </Badge>
                      {member.user_role && (
                        <Badge variant="secondary">
                          {member.user_role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined: {new Date(member.joined_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
              <p className="text-sm mb-4">This team doesn't have any members yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add First Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for and add a new member to {teamName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-search">Search User by Email</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button variant="outline" disabled={searchLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {searchResults && searchResults.length > 0 && (
              <div>
                <Label>Select User</Label>
                <Select value={formData.userId} onValueChange={(value) => setFormData({...formData, userId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {searchResults.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name || user.email || 'User'} - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="member-role">Team Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="lead">Team Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="observer">Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="joined-date">Joined Date</Label>
              <Input
                type="date"
                value={formData.joinedDate}
                onChange={(e) => setFormData({...formData, joinedDate: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember}
                disabled={addMemberMutation.isPending || !formData.userId}
              >
                {addMemberMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update role for {editingMember?.display_name || editingMember?.email || 'this member'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role">Team Role</Label>
              <Select 
                defaultValue={editingMember?.role}
                onValueChange={(value) => handleUpdateRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="lead">Team Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="observer">Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamMemberManagement;