
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus,
  UserPlus,
  Building2,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

export function TeamProviderIntegration() {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');

  // Get all teams with provider and location info
  const { data: teams = [] } = useQuery({
    queryKey: ['teams-with-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations(*),
          provider:authorized_providers(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get all profiles for user selection
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Add team member mutation with improved error handling
  const addTeamMemberMutation = useMutation({
    mutationFn: async ({ teamId, userEmail, role }: { teamId: string; userEmail: string; role: string }) => {
      // First, find the user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        throw new Error('User not found with that email address');
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this team');
      }

      // Add the team member
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: role,
          status: 'active'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      return { newMember, user };
    },
    onSuccess: (data) => {
      toast.success(`${data.user.display_name || data.user.email} added to team successfully`);
      queryClient.invalidateQueries({ queryKey: ['teams-with-details'] });
      setNewMemberEmail('');
      setNewMemberRole('MEMBER');
    },
    onError: (error: any) => {
      toast.error(`Failed to add team member: ${error.message}`);
    }
  });

  // Remove team member
  const removeTeamMemberMutation = useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['teams-with-details'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    }
  });

  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  return (
    <div className="space-y-6">
      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management & Member Addition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team to manage..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{team.name}</span>
                        <Badge variant="outline">{team.team_members?.length || 0} members</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTeamData && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-blue-800">Team:</span>
                    <p className="text-blue-700">{selectedTeamData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-800">Location:</span>
                    <p className="text-blue-700">{selectedTeamData.location?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-800">Provider:</span>
                    <p className="text-blue-700">{selectedTeamData.provider?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Team Member */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">User Email</label>
                <Input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter user email..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => addTeamMemberMutation.mutate({
                    teamId: selectedTeam,
                    userEmail: newMemberEmail,
                    role: newMemberRole
                  })}
                  disabled={!newMemberEmail || addTeamMemberMutation.isPending}
                  className="w-full"
                >
                  {addTeamMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Members */}
      {selectedTeamData && (
        <Card>
          <CardHeader>
            <CardTitle>Current Team Members ({selectedTeamData.team_members?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTeamData.team_members && selectedTeamData.team_members.length > 0 ? (
              <div className="space-y-3">
                {selectedTeamData.team_members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.profiles?.display_name || member.profiles?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      {member.profiles?.role === 'AP' && (
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          AP
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMemberMutation.mutate({ memberId: member.id })}
                        disabled={removeTeamMemberMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team members found</p>
                <p className="text-sm">Add members using the form above</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{team.name}</h4>
                  <Badge variant="outline">{team.team_members?.length || 0}</Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{team.location?.name || 'No location'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{team.provider?.name || 'No provider'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{team.status}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setSelectedTeam(team.id)}
                >
                  Manage Team
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
