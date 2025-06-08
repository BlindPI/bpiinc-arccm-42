
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  UserPlus
} from 'lucide-react';
import { RealTeamService, type RealTeam } from '@/services/team/realTeamService';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import type { DatabaseUserRole } from '@/types/database-roles';
import { canManageTeams, hasEnterpriseAccess } from '@/types/database-roles';

export function RealTeamManagementHub() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  const [selectedTeam, setSelectedTeam] = useState<RealTeam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const userRole = profile?.role as DatabaseUserRole;
  const canManage = userRole ? canManageTeams(userRole) : false;
  const hasEnterprise = userRole ? hasEnterpriseAccess(userRole) : false;

  // Real data queries using actual database functions
  const { data: teams = [], isLoading: isLoadingTeams, error: teamsError } = useQuery({
    queryKey: ['real-teams'],
    queryFn: () => RealTeamService.getEnhancedTeams(),
    refetchInterval: 60000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['real-team-analytics'],
    queryFn: () => RealTeamService.getTeamAnalytics(),
    refetchInterval: 300000,
  });

  const { data: selectedTeamMembers = [] } = useQuery({
    queryKey: ['team-members', selectedTeam?.id],
    queryFn: () => selectedTeam ? RealTeamService.getTeamMembers(selectedTeam.id) : [],
    enabled: !!selectedTeam,
  });

  const { data: selectedTeamMetrics } = useQuery({
    queryKey: ['team-metrics', selectedTeam?.id],
    queryFn: () => selectedTeam ? RealTeamService.getTeamPerformanceMetrics(selectedTeam.id) : null,
    enabled: !!selectedTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: (teamData: {
      name: string;
      description?: string;
      team_type: string;
      location_id?: string;
      provider_id?: number;
    }) => RealTeamService.createTeam({
      ...teamData,
      created_by: user?.id || ''
    }),
    onSuccess: () => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['real-teams'] });
      setShowCreateDialog(false);
    },
    onError: (error) => {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    }
  });

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingTeams) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Teams</h2>
          <p className="text-muted-foreground">
            Failed to connect to team database. Please check your connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Real-time team management with database integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Badge variant="secondary">{userRole}</Badge>
          {hasEnterprise && (
            <Badge variant="default">Enterprise Access</Badge>
          )}
        </div>
      </div>

      {selectedTeam ? (
        // Team Detail View
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedTeam.name}
                  <Badge variant="outline">
                    {selectedTeam.team_type}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTeam.description || 'No description available'}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTeam(null)}
              >
                Back to Teams
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeamMembers.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{Math.round(selectedTeam.performance_score)}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Compliance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {Math.round(selectedTeamMetrics?.compliance_score || 0)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Certificates</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {selectedTeamMetrics?.certificates_issued || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Team Members</h3>
                {canManage && (
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedTeamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {member.profiles?.display_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            <Badge variant="outline">
                              {member.profiles?.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Team List View
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {canManage && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>

          {/* Team Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Teams</span>
                </div>
                <p className="text-2xl font-bold mt-1">{analytics?.totalTeams || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Active Members</span>
                </div>
                <p className="text-2xl font-bold mt-1">{analytics?.totalMembers || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Avg Performance</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(analytics?.averagePerformance || 0)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Compliance</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(analytics?.averageCompliance || 0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.location?.name || 'No location'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium">{Math.round(team.performance_score)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Members</span>
                      <span className="font-medium">{team.member_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                        {team.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedTeam(team)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No teams found matching your search' : 'No teams available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
