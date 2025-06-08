import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download
} from 'lucide-react';
import { RealEnterpriseTeamService } from '@/services/team/realEnterpriseTeamService';
import { TeamMemberManagement } from './TeamMemberManagement';
import { CreateTeamDialog } from './CreateTeamDialog';
import { TeamTable } from './TeamTable';
import { TeamMetrics } from './TeamMetrics';
import type { EnhancedTeam } from '@/types/team-management';

interface ProfessionalTeamManagementHubProps {
  userRole?: string;
}

type UserRole = 'SA' | 'AD' | 'AP' | 'IP' | 'IT' | 'IC' | 'MEMBER';

export function ProfessionalTeamManagementHub({ userRole }: ProfessionalTeamManagementHubProps) {
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => RealEnterpriseTeamService.getEnhancedTeams(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: analytics } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => RealEnterpriseTeamService.getTeamAnalytics(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleTeamSelect = (team: EnhancedTeam) => {
    setSelectedTeam(team);
    setActiveTab('overview');
  };

  const canManageTeams = ['SA', 'AD'].includes(userRole || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Teams</h2>
          <p className="text-muted-foreground">
            There was an issue loading the team data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enterprise Team Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor your enterprise teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Badge variant="secondary">{userRole}</Badge>
        </div>
      </div>

      {selectedTeam ? (
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                {canManageTeams && (
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="overview" className="p-6">
                <TeamMetrics team={selectedTeam} />
              </TabsContent>

              <TabsContent value="members" className="p-6">
                <TeamMemberManagement 
                  team={selectedTeam} 
                  userRole={userRole}
                  canManage={canManageTeams}
                />
              </TabsContent>

              {canManageTeams && (
                <TabsContent value="settings" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Team Settings</h3>
                    <p className="text-muted-foreground">
                      Team settings and configuration options will be available here.
                    </p>
                  </div>
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
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
            {canManageTeams && (
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

          {/* Teams Table */}
          <TeamTable 
            teams={filteredTeams}
            onTeamSelect={handleTeamSelect}
            canManage={canManageTeams}
          />
        </div>
      )}

      {/* Create Team Dialog */}
      {showCreateDialog && (
        <CreateTeamDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTeamCreated={() => {
            setShowCreateDialog(false);
            // Refresh teams list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
