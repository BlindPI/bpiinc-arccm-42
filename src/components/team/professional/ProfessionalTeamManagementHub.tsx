
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Plus,
  Search,
  Filter,
  UserPlus,
  Crown,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { realTeamDataService } from '@/services/team/realTeamDataService';
import { enhancedTeamManagementService } from '@/services/team/enhancedTeamManagementService';
import { toast } from 'sonner';

// Import real components
import { TeamCreationWizard } from './TeamCreationWizard';
import { TeamMemberManagement } from './TeamMemberManagement';
import { TeamPerformanceDashboard } from './TeamPerformanceDashboard';
import { TeamSettingsPanel } from './TeamSettingsPanel';
import { TeamQuickActions } from './TeamQuickActions';

interface ProfessionalTeamManagementHubProps {
  userRole?: string;
}

export function ProfessionalTeamManagementHub({ userRole }: ProfessionalTeamManagementHubProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [teamFilter, setTeamFilter] = useState<'all' | 'my-teams' | 'managed-teams'>('all');

  // Fetch real teams data
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => realTeamDataService.getEnhancedTeams(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch team analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => realTeamDataService.getTeamAnalytics(),
    refetchInterval: 60000 // Refresh every minute
  });

  // Filter teams based on user role and search
  const filteredTeams = useMemo(() => {
    let filtered = teams;

    // Apply role-based filtering
    if (teamFilter === 'my-teams') {
      filtered = teams.filter(team => 
        team.members?.some(member => member.user_id === user?.id)
      );
    } else if (teamFilter === 'managed-teams') {
      filtered = teams.filter(team => 
        team.members?.some(member => 
          member.user_id === user?.id && member.role === 'ADMIN'
        )
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [teams, teamFilter, searchQuery, user?.id]);

  const selectedTeam = selectedTeamId 
    ? teams.find(t => t.id === selectedTeamId)
    : filteredTeams[0];

  // User permissions
  const canCreateTeams = ['SA', 'AD', 'AP'].includes(profile?.role || '');
  const canManageAllTeams = ['SA', 'AD'].includes(profile?.role || '');
  const isTeamAdmin = selectedTeam?.members?.some(m => 
    m.user_id === user?.id && m.role === 'ADMIN'
  );

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-blue-600" />
            Professional Team Management
          </h1>
          <p className="text-muted-foreground">
            Comprehensive team oversight and management capabilities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {profile?.role}
          </Badge>
          {canCreateTeams && (
            <Button onClick={() => setShowCreateWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Team Selection & Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Team Selection</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as any)}
                className="border border-input bg-background px-3 py-2 rounded-md text-sm"
              >
                <option value="all">All Teams</option>
                <option value="my-teams">My Teams</option>
                <option value="managed-teams">Teams I Manage</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <Card 
                key={team.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTeamId === team.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {team.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{team.member_count || 0}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {team.team_type}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={team.status === 'active' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {team.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'No teams match your current filter selection'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Management Interface */}
      {selectedTeam && (
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedTeam.name}
                    <Badge variant="outline">{selectedTeam.team_type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTeam.description}
                  </p>
                </div>
                <TeamQuickActions team={selectedTeam} userRole={profile?.role} />
              </div>
              
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                {(canManageAllTeams || isTeamAdmin) && (
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="overview" className="p-6">
                <TeamPerformanceDashboard team={selectedTeam} analytics={analytics} />
              </TabsContent>

              <TabsContent value="members" className="p-6">
                <TeamMemberManagement 
                  team={selectedTeam} 
                  canManage={canManageAllTeams || isTeamAdmin}
                  userRole={profile?.role}
                />
              </TabsContent>

              <TabsContent value="performance" className="p-6">
                <TeamPerformanceDashboard 
                  team={selectedTeam} 
                  analytics={analytics}
                  detailed={true}
                />
              </TabsContent>

              {(canManageAllTeams || isTeamAdmin) && (
                <TabsContent value="settings" className="p-6">
                  <TeamSettingsPanel 
                    team={selectedTeam} 
                    canManage={canManageAllTeams || isTeamAdmin}
                  />
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>
      )}

      {/* Team Creation Wizard */}
      {showCreateWizard && (
        <TeamCreationWizard 
          onClose={() => setShowCreateWizard(false)}
          onTeamCreated={(team) => {
            setShowCreateWizard(false);
            setSelectedTeamId(team.id);
            queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
            toast.success('Team created successfully');
          }}
        />
      )}
    </div>
  );
}
