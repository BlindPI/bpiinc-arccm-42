/**
 * CLEAN TEAM MANAGEMENT HUB
 * Uses CleanAPTeamService - no broken dependencies
 * Simple, working team management interface
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CleanAPTeamService } from '@/services/clean/CleanAPTeamService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Users,
  MapPin,
  UserCheck,
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMemberWithProfile {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  displayName: string;
  email: string;
}

export function CleanTeamManagementHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Get user's teams if they are an AP user
  const { data: userTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['clean-user-teams', user?.id],
    queryFn: () => user?.id ? CleanAPTeamService.getAPUserTeams(user.id) : [],
    enabled: !!user?.id,
  });

  // Get dashboard for current user
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['clean-ap-dashboard', user?.id],
    queryFn: () => user?.id ? CleanAPTeamService.getAPUserDashboard(user.id) : null,
    enabled: !!user?.id,
  });

  // Get team members for selected team
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['clean-team-members', selectedTeam],
    queryFn: () => selectedTeam ? CleanAPTeamService.getTeamMembers(selectedTeam) : [],
    enabled: !!selectedTeam,
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeam || !newMemberEmail) return;
      
      // For demo purposes, we'll need to find the user by email first
      // In a real app, you'd have a user search endpoint
      throw new Error('User lookup by email not implemented yet');
    },
    onSuccess: () => {
      toast.success('Team member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['clean-team-members', selectedTeam] });
      setNewMemberEmail('');
    },
    onError: (error: any) => {
      toast.error(`Failed to add member: ${error.message}`);
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      CleanAPTeamService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      toast.success('Team member removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['clean-team-members', selectedTeam] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  if (teamsLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading team management...</p>
      </div>
    );
  }

  // Show message if user has no teams
  if (!userTeams.length && !dashboard?.locations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Professional Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Teams Available</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any teams assigned yet. Contact your administrator to get started with team management.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Getting Started</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    To manage teams, an administrator needs to:
                  </p>
                  <ol className="text-sm text-amber-700 mt-2 ml-4 list-decimal">
                    <li>Assign you to a location</li>
                    <li>Create teams for that location</li>
                    <li>Set you as the team manager</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Management Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Management Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your teams and members across locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Professional Mode
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dashboard.locations.length}</div>
              <p className="text-xs text-gray-500 mt-1">Assigned locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.locations.reduce((sum, loc) => sum + loc.teamCount, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total teams managed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboard.locations.reduce((sum, loc) => sum + loc.memberCount, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total team members</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Locations Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.locations.length === 0 ? (
                    <p className="text-muted-foreground">No locations assigned.</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.locations.map((location) => (
                        <div key={location.locationId} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{location.locationName}</span>
                            <p className="text-sm text-gray-500">
                              {location.teamCount} team{location.teamCount !== 1 ? 's' : ''}, {location.memberCount} member{location.memberCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Activity tracking coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Teams ({userTeams.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {userTeams.length === 0 ? (
                <p className="text-muted-foreground">No teams found.</p>
              ) : (
                <div className="space-y-3">
                  {userTeams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-gray-500">{team.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {team.teamType}
                          </Badge>
                          <Badge variant={team.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {team.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team.id);
                          setActiveTab('members');
                        }}
                      >
                        Manage Members
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Member Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Selection */}
              <div className="space-y-2">
                <Label htmlFor="team-select">Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Members List */}
              {selectedTeam && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Team Members ({teamMembers.length})</h3>
                  </div>

                  {membersLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading members...
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No members in this team yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{member.displayName}</span>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                              <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate({ 
                              teamId: selectedTeam, 
                              userId: member.userId 
                            })}
                            disabled={removeMemberMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}