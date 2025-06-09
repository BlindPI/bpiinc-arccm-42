
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RealTeamDataService } from '@/services/team/realTeamDataService';
import { TeamCreationForm } from './forms/TeamCreationForm';
import { MemberInvitationWorkflow } from './workflows/MemberInvitationWorkflow';
import { BulkOperationsInterface } from './bulk/BulkOperationsInterface';
import { TeamAnalyticsDashboard } from './analytics/TeamAnalyticsDashboard';
import { WorkflowQueue } from './workflow/WorkflowQueue';
import { ComplianceService } from '@/services/team/complianceService';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  Search,
  Plus,
  Filter,
  Shield,
  Workflow,
  TrendingUp
} from 'lucide-react';
import type { EnhancedTeam } from '@/types/team-management';

export function RealEnterpriseTeamHub() {
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => RealTeamDataService.getEnhancedTeams(),
    refetchInterval: 60000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => RealTeamDataService.getTeamAnalytics(),
    refetchInterval: 300000,
  });

  const { data: complianceMetrics } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: () => ComplianceService.getComplianceMetrics(),
    refetchInterval: 300000,
  });

  const handleTeamSelect = (team: EnhancedTeam) => {
    setSelectedTeam(team);
    setActiveTab('overview');
  };

  const handleTeamCreated = (teamId: string) => {
    setShowCreateForm(false);
    // Find and select the newly created team
    const newTeam = teams.find(t => t.id === teamId);
    if (newTeam) {
      setSelectedTeam(newTeam);
    }
  };

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

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Team</h1>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Back to Teams
          </Button>
        </div>
        <TeamCreationForm
          onSuccess={handleTeamCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedTeam.name}</h1>
            <p className="text-muted-foreground">
              {selectedTeam.description || 'Team management and operations'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTeam(null)}>
            Back to Teams
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Ops</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                  <p className="text-2xl font-bold mt-1">{selectedTeam.performance_score}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge className="mt-1">{selectedTeam.status}</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div>Member management interface would go here</div>
          </TabsContent>

          <TabsContent value="invitations">
            <MemberInvitationWorkflow teamId={selectedTeam.id} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkOperationsInterface teamId={selectedTeam.id} />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowQueue teamId={selectedTeam.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <TeamAnalyticsDashboard teamId={selectedTeam.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enterprise Team Management</h1>
          <p className="text-muted-foreground">
            Comprehensive team management with real database integration
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

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
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Teams</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics?.totalTeams || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics?.totalMembers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
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
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Compliance</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Math.round(complianceMetrics?.overall_compliance || 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
                    {team.performance_score}%
                  </span>
                </div>

                {team.location && (
                  <p className="text-xs text-muted-foreground">
                    📍 {team.location.name}
                  </p>
                )}

                <Button 
                  onClick={() => handleTeamSelect(team)}
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

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No teams found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No teams match your search criteria.' : 'Get started by creating your first team.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
