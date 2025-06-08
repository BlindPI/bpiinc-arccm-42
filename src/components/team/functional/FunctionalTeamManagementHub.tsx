
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedTeamService } from '@/services/team/enhancedTeamService';
import { FunctionalTeamMemberList } from './FunctionalTeamMemberList';
import { TeamSettingsModal } from '../enhanced/TeamSettingsModal';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Settings, 
  TrendingUp,
  MapPin,
  AlertCircle,
  Activity,
  BarChart3,
  Crown
} from 'lucide-react';
import type { SimpleTeam } from '@/types/simplified-team-management';

export function FunctionalTeamManagementHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);

  // Fetch teams with enhanced member data
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teams-enhanced'],
    queryFn: () => enhancedTeamService.getTeamsWithEnhancedMembers(),
    refetchInterval: 30000
  });

  // Get selected team details
  const { data: selectedTeam } = useQuery({
    queryKey: ['team-enhanced-details', selectedTeamId],
    queryFn: () => enhancedTeamService.getTeamWithEnhancedMembers(selectedTeamId),
    enabled: !!selectedTeamId
  });

  // Check management permissions
  const { data: canManage = false } = useQuery({
    queryKey: ['can-manage-team-enhanced', selectedTeamId, user?.id],
    queryFn: () => enhancedTeamService.canUserManageTeam(selectedTeamId, user?.id || ''),
    enabled: !!(selectedTeamId && user?.id)
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role: 'MEMBER' | 'ADMIN' }) =>
      enhancedTeamService.addTeamMember(teamId, userId, role),
    onSuccess: () => {
      toast.success('Team member added successfully');
      queryClient.invalidateQueries({ queryKey: ['teams-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['team-enhanced-details', selectedTeamId] });
      setShowAddMember(false);
    },
    onError: (error) => {
      console.error('Error adding member:', error);
      toast.error('Failed to add team member');
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, updates }: { teamId: string; updates: Partial<SimpleTeam> }) =>
      enhancedTeamService.updateTeam(teamId, updates),
    onSuccess: () => {
      toast.success('Team settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teams-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['team-enhanced-details', selectedTeamId] });
      setShowTeamSettings(false);
    },
    onError: (error) => {
      console.error('Error updating team:', error);
      toast.error('Failed to update team settings');
    }
  });

  const handleAddMember = (userId: string, role: 'MEMBER' | 'ADMIN') => {
    if (selectedTeamId) {
      addMemberMutation.mutate({
        teamId: selectedTeamId,
        userId,
        role
      });
    }
  };

  const handleUpdateTeam = (updates: Partial<SimpleTeam>) => {
    if (selectedTeamId) {
      updateTeamMutation.mutate({
        teamId: selectedTeamId,
        updates
      });
    }
  };

  const handleEditMember = (member: any) => {
    // Implementation for editing member
    console.log('Edit member:', member);
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      // Implementation for removing member
      console.log('Remove member:', memberId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Team Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Error Loading Teams</h3>
            <p className="text-red-600">{error?.message || 'Failed to load team data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnterpriseUser = ['SA', 'AD', 'AP'].includes(user?.profile?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and settings with professional team tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {teams.length} Teams
          </Badge>
          {isEnterpriseUser && (
            <Badge variant="default" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Enterprise
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={selectedTeamId || 'overview'} onValueChange={setSelectedTeamId}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {teams.map((team) => (
            <TabsTrigger key={team.id} value={team.id}>
              {team.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => setSelectedTeamId(team.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{team.member_count} members</span>
                    </div>
                    
                    {team.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{team.location.name}</span>
                      </div>
                    )}
                    
                    {team.performance_score !== null && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Performance: {team.performance_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {teams.map((team) => (
          <TabsContent key={team.id} value={team.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {team.description || 'No description available'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Button
                          onClick={() => setShowAddMember(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Member
                        </Button>
                        <Button variant="outline" size="icon">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowTeamSettings(true)}
                      title="Team Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Members</p>
                      <p className="text-lg font-semibold">{team.member_count}</p>
                    </div>
                  </div>
                  
                  {team.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-lg font-semibold">{team.location.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <p className="text-lg font-semibold">
                        {team.performance_score !== null ? `${team.performance_score}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold capitalize">{team.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedTeam && (
              <FunctionalTeamMemberList
                team={selectedTeam}
                canManage={canManage}
                onEditMember={handleEditMember}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modals */}
      {showAddMember && selectedTeamId && (
        <AddTeamMemberModal
          teamId={selectedTeamId}
          onAdd={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {showTeamSettings && selectedTeam && (
        <TeamSettingsModal
          team={selectedTeam}
          canEdit={canManage}
          onSave={handleUpdateTeam}
          onClose={() => setShowTeamSettings(false)}
        />
      )}
    </div>
  );
}
