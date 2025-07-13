import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { UnifiedTeamService } from '@/services/team/unifiedTeamService';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EnhancedTeamCard } from '@/components/teams/EnhancedTeamCard';
import { CreateTeamDialog } from '@/components/team/professional/CreateTeamDialog';
import { TeamDetailsDialog } from '@/components/team/professional/TeamDetailsDialog';
import { ComprehensiveMemberManagement } from '@/components/team/member-management/ComprehensiveMemberManagement';
import { TeamAnalyticsDashboard } from '@/components/team/analytics/TeamAnalyticsDashboard';
import { BulkOperationsInterface } from '@/components/team/bulk/BulkOperationsInterface';
import { MemberInvitationWorkflow } from '@/components/team/workflows/MemberInvitationWorkflow';
import { WorkflowQueue } from '@/components/team/workflow/WorkflowQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Search, 
  Plus, 
  Shield, 
  Crown, 
  UserCheck,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Teams() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { role, permissions } = useUserRole();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeManagementTab, setActiveManagementTab] = useState('overview');

  // Fetch teams
  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['unified-teams', role, user?.id],
    queryFn: () => UnifiedTeamService.getTeams(role!, user?.id!),
    enabled: !!role && !!user?.id,
  });

  // Fetch analytics for admin users
  const { data: analytics } = useQuery({
    queryKey: ['team-analytics', role],
    queryFn: () => UnifiedTeamService.getTeamAnalytics(),
    enabled: permissions.isSystemAdmin || permissions.isAdmin,
  });

  // Filter teams based on search
  const filteredTeams = teams.filter(team => 
    !searchTerm || 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if user has professional access for enhanced functionality
  const hasProfessionalAccess = ['SA', 'AD', 'AP', 'IP', 'IT'].includes(role || '');

  // Team action handlers
  const handleViewDetails = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      setShowDetailsDialog(true);
    }
  };

  const handleManageTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      setActiveManagementTab('overview');
      // Reset details dialog to false when switching to management
      setShowDetailsDialog(false);
    }
  };

  const handleCreateTeam = () => {
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has management permissions and a team is selected, show integrated management interface
  if (permissions.canManageTeams && selectedTeam && !showDetailsDialog) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTeam(null)}
              className="mb-2"
            >
              ← Back to Teams
            </Button>
            <h1 className="text-2xl font-bold">{selectedTeam.name}</h1>
            <p className="text-muted-foreground">
              {selectedTeam.description || 'Team management and operations'}
            </p>
          </div>
        </div>

        <Tabs value={activeManagementTab} onValueChange={setActiveManagementTab}>
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
                  <p className="text-2xl font-bold mt-1">{selectedTeam.members?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTeam.members?.filter(m => m.status === 'active').length || 0} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.performance_score || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Team performance score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge className="mt-1">{selectedTeam.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Current team status</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Team Details */}
            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Team Type</label>
                    <p className="text-sm text-muted-foreground">{selectedTeam.team_type || 'operational'}</p>
                  </div>
                  {selectedTeam.location && (
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedTeam.location.name}
                        {selectedTeam.location.city && `, ${selectedTeam.location.city}`}
                        {selectedTeam.location.state && `, ${selectedTeam.location.state}`}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTeam.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <ComprehensiveMemberManagement teamId={selectedTeam.id} />
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {permissions.isSystemAdmin || permissions.isAdmin ? (
              <>
                <Crown className="h-6 w-6 text-yellow-600" />
                Enterprise Teams
              </>
            ) : role === 'AP' ? (
              <>
                <Building2 className="h-6 w-6 text-blue-600" />
                Provider Teams
              </>
            ) : (
              <>
                <Users className="h-6 w-6 text-green-600" />
                My Teams
              </>
            )}
          </h1>
          <p className="text-muted-foreground">
            {permissions.isSystemAdmin || permissions.isAdmin 
              ? 'Manage all teams across the organization'
              : role === 'AP'
              ? 'Manage your provider teams'
              : 'View and participate in your teams'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {permissions.isSystemAdmin && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              System Admin
            </Badge>
          )}
          {permissions.isAdmin && !permissions.isSystemAdmin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Administrator
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Availability Manager</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage schedules and availability
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/availability')}
                size="sm"
                className="gap-2"
              >
                Open
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Analytics & Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    View team performance data
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/analytics')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                View
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      {(permissions.isSystemAdmin || permissions.isAdmin) && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Teams</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.totalTeams}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {teams.filter(t => t.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.totalMembers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Across all teams
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
                {Math.round(analytics.averagePerformance)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Team performance
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
                {Math.round(analytics.averageCompliance)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compliance rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Actions */}
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
        
        {permissions.canCreateTeams && (
          <Button className="gap-2" onClick={handleCreateTeam}>
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <EnhancedTeamCard
            key={team.id}
            team={team}
            onViewDetails={handleViewDetails}
            onManage={handleManageTeam}
          />
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'No teams match your search criteria.'
                : 'You are not currently assigned to any teams.'
              }
            </p>
            {permissions.canCreateTeams && (
              <Button className="gap-2" onClick={handleCreateTeam}>
                <Plus className="h-4 w-4" />
                Create Your First Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      {showCreateDialog && (
        <CreateTeamDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTeamCreated={() => {
            setShowCreateDialog(false);
            refetch(); // Refresh teams list
          }}
        />
      )}

      {/* Team Details Dialog */}
      {showDetailsDialog && selectedTeam && (
        <TeamDetailsDialog
          team={selectedTeam}
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
}