import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Filter,
  BarChart3,
  Settings,
  Grid,
  List,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Star,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import our modern components
import { TeamCardGrid } from './TeamCardGrid';
import { AdvancedTeamDataTable } from './AdvancedTeamDataTable';
import { DragDropMemberManager } from './DragDropMemberManager';
import { RealTimeTeamUpdates } from './RealTimeTeamUpdates';

// Import services
import { AdminTeamService } from '@/services/team/AdminTeamService';
import { RealTeamService } from '@/services/team/realTeamService';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

interface ModernTeamDashboardProps {
  userRole?: string;
  userId?: string;
}

export function ModernTeamDashboard({ userRole, userId }: ModernTeamDashboardProps) {
  const [activeView, setActiveView] = useState<'grid' | 'table' | 'members'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);

  const queryClient = useQueryClient();

  // Fetch teams data
  const { data: teams = [], isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['teams', 'enhanced'],
    queryFn: async () => {
      try {
        const data = await RealTeamService.getEnhancedTeams();
        return data || [];
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch available users for member management
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['users', 'available'],
    queryFn: async () => {
      try {
        // This would be replaced with actual service call
        return [];
      } catch (error) {
        console.error('Failed to fetch available users:', error);
        return [];
      }
    },
  });

  // Team update mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, updates }: { teamId: string; updates: Partial<EnhancedTeam> }) => {
      // Convert EnhancedTeam updates to AdminTeamUpdateData format
      const adminUpdates = {
        name: updates.name,
        description: updates.description,
        team_type: updates.team_type,
        status: updates.status,
        location_id: updates.location_id,
        provider_id: updates.provider_id ? Number(updates.provider_id) : undefined,
        metadata: updates.metadata,
        monthly_targets: updates.monthly_targets,
        current_metrics: updates.current_metrics,
      };
      return AdminTeamService.updateTeam(teamId, adminUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Team delete mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return AdminTeamService.deleteTeam(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Member management mutations
  const memberTransferMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      fromTeamId, 
      toTeamId, 
      role 
    }: { 
      userId: string; 
      fromTeamId: string | null; 
      toTeamId: string; 
      role: 'ADMIN' | 'MEMBER' 
    }) => {
      if (fromTeamId) {
        await AdminTeamService.removeTeamMember(fromTeamId, userId);
      }
      await AdminTeamService.addTeamMember(toTeamId, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const memberRemoveMutation = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string }) => {
      return AdminTeamService.removeTeamMember(teamId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const memberAddMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      teamId, 
      role 
    }: { 
      userId: string; 
      teamId: string; 
      role: 'ADMIN' | 'MEMBER' 
    }) => {
      return AdminTeamService.addTeamMember(teamId, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ action, teamIds }: { action: string; teamIds: string[] }) => {
      // Implement bulk operations based on action
      const promises = teamIds.map(teamId => {
        switch (action) {
          case 'activate':
            return AdminTeamService.updateTeam(teamId, { status: 'active' });
          case 'deactivate':
            return AdminTeamService.updateTeam(teamId, { status: 'inactive' });
          case 'delete':
            return AdminTeamService.deleteTeam(teamId);
          default:
            return Promise.resolve();
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Calculate dashboard statistics
  const dashboardStats = React.useMemo(() => {
    const totalTeams = teams.length;
    const activeTeams = teams.filter(t => t.status === 'active').length;
    const totalMembers = teams.reduce((sum, team) => sum + (team.member_count || team.members?.length || 0), 0);
    const avgPerformance = teams.length > 0 
      ? teams.reduce((sum, team) => sum + team.performance_score, 0) / teams.length 
      : 0;

    return {
      totalTeams,
      activeTeams,
      totalMembers,
      avgPerformance: Math.round(avgPerformance),
      inactiveTeams: totalTeams - activeTeams,
    };
  }, [teams]);

  const handleTeamUpdate = async (teamId: string, updates: Partial<EnhancedTeam>) => {
    try {
      await updateTeamMutation.mutateAsync({ teamId, updates });
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleTeamDelete = async (team: EnhancedTeam) => {
    if (window.confirm(`Are you sure you want to delete team "${team.name}"?`)) {
      try {
        await deleteTeamMutation.mutateAsync(team.id);
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const handleMemberTransfer = async (
    userId: string, 
    fromTeamId: string | null, 
    toTeamId: string, 
    role: 'ADMIN' | 'MEMBER'
  ) => {
    try {
      await memberTransferMutation.mutateAsync({ userId, fromTeamId, toTeamId, role });
    } catch (error) {
      console.error('Failed to transfer member:', error);
    }
  };

  const handleMemberRemove = async (userId: string, teamId: string) => {
    try {
      await memberRemoveMutation.mutateAsync({ userId, teamId });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleMemberAdd = async (userId: string, teamId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await memberAddMutation.mutateAsync({ userId, teamId, role });
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleBulkAction = async (action: string, teamIds: string[]) => {
    try {
      await bulkOperationMutation.mutateAsync({ action, teamIds });
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const handleTeamUpdated = (teamId: string) => {
    // Refresh specific team data or entire teams list
    refetchTeams();
  };

  const isAdmin = userRole === 'SA' || userRole === 'AD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-gray-600">
            Manage teams, members, and performance with modern tools
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetchTeams()}
            disabled={teamsLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", teamsLoading && "animate-spin")} />
            Refresh
          </Button>
          
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowMemberManager(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
              
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Teams</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{dashboardStats.totalTeams}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Active Teams</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-green-600">{dashboardStats.activeTeams}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Members</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{dashboardStats.totalMembers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Avg Performance</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{dashboardStats.avgPerformance}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Inactive</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-600">{dashboardStats.inactiveTeams}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Teams Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teams</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex border rounded-md">
                    <Button
                      variant={activeView === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveView('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveView('table')}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeView === 'members' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveView('members')}
                      className="rounded-l-none"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeView === 'grid' && (
                <TeamCardGrid
                  teams={teams}
                  onTeamSelect={setSelectedTeam}
                  onTeamEdit={isAdmin ? (team) => setSelectedTeam(team) : undefined}
                  onTeamDelete={isAdmin ? handleTeamDelete : undefined}
                  loading={teamsLoading}
                  viewMode="grid"
                />
              )}
              
              {activeView === 'table' && (
                <AdvancedTeamDataTable
                  teams={teams}
                  onTeamUpdate={isAdmin ? handleTeamUpdate : undefined}
                  onTeamDelete={isAdmin ? async (teamId) => {
                    const team = teams.find(t => t.id === teamId);
                    if (team) await handleTeamDelete(team);
                  } : undefined}
                  onTeamSelect={setSelectedTeam}
                  onBulkAction={isAdmin ? handleBulkAction : undefined}
                  loading={teamsLoading}
                />
              )}
              
              {activeView === 'members' && (
                <DragDropMemberManager
                  teams={teams}
                  availableUsers={availableUsers}
                  onMemberTransfer={isAdmin ? handleMemberTransfer : async () => {}}
                  onMemberRemove={isAdmin ? handleMemberRemove : async () => {}}
                  onMemberAdd={isAdmin ? handleMemberAdd : async () => {}}
                  loading={teamsLoading}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Real-time Updates */}
          <RealTimeTeamUpdates
            teams={teams}
            onTeamUpdate={handleTeamUpdated}
            maxUpdates={10}
            autoMarkAsRead={true}
          />

          {/* Quick Actions */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Team
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowMemberManager(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {/* Export functionality */}}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {/* Import functionality */}}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Member Manager Dialog */}
      <Dialog open={showMemberManager} onOpenChange={setShowMemberManager}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Management</DialogTitle>
          </DialogHeader>
          <DragDropMemberManager
            teams={teams}
            availableUsers={availableUsers}
            onMemberTransfer={handleMemberTransfer}
            onMemberRemove={handleMemberRemove}
            onMemberAdd={handleMemberAdd}
            loading={teamsLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}