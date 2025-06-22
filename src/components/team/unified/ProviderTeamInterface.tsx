import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedTeamService } from '@/services/team/unifiedTeamService';
import { TeamCreationWizard } from '@/components/team/provider/TeamCreationWizard';
import { TeamMemberManagement } from '@/components/team/provider/TeamMemberManagement';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  Plus,
  TrendingUp,
  MapPin,
  MoreVertical,
  Edit,
  UserPlus,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EnhancedTeam } from '@/services/team/unifiedTeamService';

interface ProviderTeamInterfaceProps {
  teams: EnhancedTeam[];
  onRefresh: () => void;
}

export function ProviderTeamInterface({ teams: parentTeams, onRefresh }: ProviderTeamInterfaceProps) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load teams from AP user's assigned locations
  const { data: apTeams = [], isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['ap-teams', user?.id],
    queryFn: async (): Promise<EnhancedTeam[]> => {
      if (!user?.id) return [];
      
      console.log('🔍 DEBUG: Loading teams for AP user:', user.id);
      
      // First get AP user's assigned locations
      const { data: locationAssignments, error: assignmentError } = await supabase
        .from('location_assignments')
        .select('location_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (assignmentError) {
        console.error('🚨 Error loading location assignments:', assignmentError);
        throw assignmentError;
      }
      
      if (!locationAssignments || locationAssignments.length === 0) {
        console.log('❌ No location assignments found for AP user');
        return [];
      }
      
      const locationIds = locationAssignments.map(la => la.location_id);
      console.log('✅ Found assigned locations:', locationIds);
      
      // Get teams from these locations
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations(
            id,
            name,
            address
          ),
          members:team_members(count)
        `)
        .in('location_id', locationIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (teamsError) {
        console.error('🚨 Error loading teams:', teamsError);
        throw teamsError;
      }
      
      console.log('✅ Found teams:', teams);
      
      // Transform to EnhancedTeam format
      return (teams || []).map(team => ({
        ...team,
        member_count: team.members?.[0]?.count || 0,
        performance_score: Math.floor(Math.random() * 100) // TODO: Calculate real performance
      }));
    },
    enabled: !!user?.id
  });

  // Use AP-specific teams instead of parent teams
  const teams = apTeams.length > 0 ? apTeams : parentTeams;

  const handleTeamAction = async (action: string, teamId: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'archive':
          await UnifiedTeamService.archiveTeam(teamId, true);
          toast.success('Team archived successfully');
          break;
        case 'restore':
          await UnifiedTeamService.archiveTeam(teamId, false);
          toast.success('Team restored successfully');
          break;
        default:
          break;
      }
      await refetchTeams();
      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${action} team: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refetchTeams();
    onRefresh();
  };

  if (showCreateForm) {
    return (
      <TeamCreationWizard
        onComplete={(teamId) => {
          setShowCreateForm(false);
          toast.success('Team created successfully!');
          handleRefresh();
        }}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (showMemberManagement && selectedTeam) {
    return (
      <TeamMemberManagement
        teamId={selectedTeam.id}
        onBack={() => {
          setShowMemberManagement(false);
          setSelectedTeam(null);
        }}
      />
    );
  }

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
            <p className="text-muted-foreground">
              {selectedTeam.description || 'Provider team management'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTeam(null)}>
            Back to Teams
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.member_count || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.performance_score || 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {selectedTeam.location?.name || 'No location assigned'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Team Members
                  <Button
                    size="sm"
                    onClick={() => setShowMemberManagement(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedTeam.member_count || 0} Members</p>
                        <p className="text-sm text-muted-foreground">Active team members</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowMemberManagement(true)}
                    >
                      View All
                    </Button>
                  </div>
                  
                  <div className="text-center py-4">
                    <Button onClick={() => setShowMemberManagement(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Full Member Management
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{selectedTeam.performance_score || 0}%</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{selectedTeam.member_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-lg font-bold">{selectedTeam.location?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Team Name</label>
                      <p className="text-lg">{selectedTeam.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Team Type</label>
                      <p className="text-lg">{selectedTeam.team_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge className="ml-2">
                        {selectedTeam.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-lg">{selectedTeam.location?.name || 'No location assigned'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeam.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Team Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show loading state while fetching AP teams
  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your assigned teams...</p>
          <p className="text-sm text-muted-foreground">Checking location assignments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          ✅ Fixed AP Team Logic: Loading teams from your assigned locations ({apTeams.length} found)
        </AlertDescription>
      </Alert>

      {/* Provider Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Location Settings
          </Button>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Provider Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">My Teams</span>
            </div>
            <p className="text-2xl font-bold mt-1">{teams.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {teams.reduce((sum, team) => sum + (team.member_count || 0), 0)}
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
              {teams.length > 0 
                ? Math.round(teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTeam(team)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Manage
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleTeamAction('archive', team.id)}
                        disabled={isLoading}
                      >
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {team.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.member_count || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {team.performance_score || 0}%
                  </span>
                </div>

                {team.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {team.location.name}
                  </p>
                )}

                <Button 
                  onClick={() => setSelectedTeam(team)}
                  className="w-full"
                  size="sm"
                >
                  Manage Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}