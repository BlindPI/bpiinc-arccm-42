import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedTeamService } from '@/services/team/unifiedTeamService';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  Search,
  Plus,
  Filter,
  Shield,
  Crown,
  TrendingUp,
  MapPin,
  UserCheck,
  AlertTriangle,
  Calendar,
  Clock,
  Activity,
  ExternalLink
} from 'lucide-react';

// Role-adaptive interface components
import { AdminTeamInterface } from '@/components/team/unified/AdminTeamInterface';
import { ProviderTeamInterface } from '@/components/team/unified/ProviderTeamInterface';
import { MemberTeamInterface } from '@/components/team/unified/MemberTeamInterface';

// Legacy integration components for backward compatibility
import { TeamAvailabilityDashboard } from '@/components/team/TeamAvailabilityDashboard';
import { BulkSchedulingPanel } from '@/components/team/BulkSchedulingPanel';
import { CalendarSyncSetup } from '@/components/integration/CalendarSyncSetup';
import { NotificationCenter } from '@/components/integration/NotificationCenter';

interface TeamManagementPanelProps {
  onNavigateToAvailability?: () => void;
}

export const TeamManagementPanel: React.FC<TeamManagementPanelProps> = ({
  onNavigateToAvailability
}) => {
  const { user } = useAuth();
  const { role, permissions, isLoading: roleLoading } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('teams');
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    location: '',
    teamType: ''
  });

  // Fetch teams based on user role
  const { data: teams = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-teams', role, user?.id],
    queryFn: () => UnifiedTeamService.getTeams(role!, user?.id!),
    enabled: !!role && !!user?.id,
    refetchInterval: 60000,
  });

  // Fetch analytics for admin users
  const { data: analytics } = useQuery({
    queryKey: ['team-analytics', role],
    queryFn: () => UnifiedTeamService.getTeamAnalytics(),
    enabled: permissions.isSystemAdmin || permissions.isAdmin,
    refetchInterval: 300000,
  });

  // Fetch compliance metrics for admin users
  const { data: complianceMetrics } = useQuery({
    queryKey: ['compliance-metrics', role],
    queryFn: () => UnifiedTeamService.getComplianceMetrics(),
    enabled: permissions.isSystemAdmin || permissions.isAdmin,
    refetchInterval: 300000,
  });

  // Legacy team metrics for backward compatibility
  const { data: teamMetrics } = useQuery({
    queryKey: ['team-metrics'],
    queryFn: async () => {
      return {
        totalMembers: teams?.length || 0,
        activeBulkOps: 0,
        upcomingBookings: 0,
        teamMembers: [],
        teamRoles: {}
      };
    },
    enabled: !!teams
  });

  // Filter teams based on search and filters
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = !searchTerm || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !selectedFilters.status || team.status === selectedFilters.status;
      const matchesLocation = !selectedFilters.location || team.location_id === selectedFilters.location;
      const matchesType = !selectedFilters.teamType || team.team_type === selectedFilters.teamType;
      
      return matchesSearch && matchesStatus && matchesLocation && matchesType;
    });
  }, [teams, searchTerm, selectedFilters]);

  // Get user's team ID (for now, using a default team concept)
  const teamId = 'default-team';
  const teamMembersFormatted = [];

  const isManager = permissions.canManageTeams;

  const getRoleColor = (role: string) => {
    const colors = {
      'IC': 'bg-blue-100 text-blue-800',
      'IP': 'bg-yellow-100 text-yellow-800', 
      'IT': 'bg-green-100 text-green-800',
      'AP': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'IC': 'Instructor Candidate',
      'IP': 'Instructor Provisional',
      'IT': 'Instructor Trainer', 
      'AP': 'Authorized Provider'
    };
    return labels[role] || role;
  };

  // Loading state
  if (roleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-4">Error Loading Teams</h2>
          <p className="text-muted-foreground mb-4">
            There was an issue loading the team data. Please try again.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Render role-appropriate interface
  const renderRoleInterface = () => {
    if (permissions.isSystemAdmin || permissions.isAdmin) {
      return (
        <AdminTeamInterface 
          teams={filteredTeams}
          analytics={analytics}
          complianceMetrics={complianceMetrics}
          onRefresh={refetch}
        />
      );
    }
    
    if (role === 'AP') {
      return (
        <ProviderTeamInterface 
          teams={filteredTeams}
          onRefresh={refetch}
        />
      );
    }
    
    return (
      <MemberTeamInterface 
        teams={filteredTeams}
        onRefresh={refetch}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with role-appropriate title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {permissions.isSystemAdmin || permissions.isAdmin ? (
              <>
                <Crown className="h-5 w-5 text-yellow-600" />
                Enterprise Team Management
              </>
            ) : role === 'AP' ? (
              <>
                <Building2 className="h-5 w-5 text-blue-600" />
                Provider Team Management
              </>
            ) : (
              <>
                <Users className="h-5 w-5 text-green-600" />
                My Teams
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {permissions.isSystemAdmin || permissions.isAdmin 
              ? 'Advanced team governance, analytics, and compliance monitoring'
              : role === 'AP'
              ? 'Manage your provider teams and member assignments'
              : 'View and participate in your assigned teams'
            }
          </p>
        </div>
        
        {/* Role-appropriate badges */}
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
          {role === 'AP' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Provider
            </Badge>
          )}
        </div>
      </div>

      {/* Enhanced Availability Link */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Full Availability Management</h3>
                <p className="text-sm text-muted-foreground">
                  Access complete availability management with scheduling and approvals
                </p>
              </div>
            </div>
            <Button 
              onClick={onNavigateToAvailability}
              size="sm"
              className="gap-2"
            >
              Open Manager
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
        
        {permissions.canManageTeams && (
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        )}
      </div>

      {/* Analytics Overview - for admin users only */}
      {(permissions.isSystemAdmin || permissions.isAdmin) && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Teams</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.totalTeams}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.totalMembers}</p>
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Compliance</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {Math.round(complianceMetrics?.overallCompliance || 0)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Management Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">Team Management</TabsTrigger>
          <TabsTrigger value="bulk-scheduling">Bulk Scheduling</TabsTrigger>
          <TabsTrigger value="integrations">Calendar Sync</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {/* Role-Adaptive Interface */}
          {renderRoleInterface()}

          {/* Empty state */}
          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No teams match your search criteria.' 
                  : permissions.canManageTeams
                  ? 'Get started by creating your first team.'
                  : 'You are not currently assigned to any teams.'
                }
              </p>
              {permissions.canManageTeams && !searchTerm && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk-scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Bulk Scheduling Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isManager ? (
                <BulkSchedulingPanel teamId={teamId} teamMembers={teamMembersFormatted} />
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Manager Access Required</h3>
                  <p className="text-muted-foreground">
                    Bulk scheduling operations are available to managers and administrators only.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                External Calendar Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarSyncSetup />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Notification Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationCenter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};