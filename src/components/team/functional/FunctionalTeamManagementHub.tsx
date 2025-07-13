
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, BarChart3, Users, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { RealMemberTable } from './RealMemberTable';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { EnhancedTeamCard } from '../EnhancedTeamCard';
import { realTeamDataService } from '@/services/team/realTeamDataService';
import { supabase } from '@/integrations/supabase/client';

interface FunctionalTeamManagementHubProps {
  userRole?: string;
}

export function FunctionalTeamManagementHub({ userRole }: FunctionalTeamManagementHubProps) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Real-time data with proper refresh intervals
  const { data: teams = [], isLoading: isLoadingTeams, error: teamsError } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => realTeamDataService.getAllTeams(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  const { data: systemAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => realTeamDataService.getSystemAnalytics(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000
  });

  // Fetch team members for each team
  const { data: teamMembers = {} } = useQuery({
    queryKey: ['team-members-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          profiles:user_id (
            id,
            display_name,
            role,
            status,
            compliance_status
          )
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Group members by team_id
      const groupedMembers: Record<string, any[]> = {};
      data?.forEach(member => {
        if (!groupedMembers[member.team_id]) {
          groupedMembers[member.team_id] = [];
        }
        if (member.profiles) {
          groupedMembers[member.team_id].push(member.profiles);
        }
      });
      
      return groupedMembers;
    },
    enabled: teams.length > 0,
    refetchInterval: 45000
  });

  const canManageTeams = ['SA', 'AD'].includes(userRole || '');

  if (isLoadingTeams || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-red-600">Error loading teams</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Team Management Hub</h1>
          <p className="text-muted-foreground text-lg">
            Professional team oversight and performance management
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time data</span>
            </div>
            <span>•</span>
            <span>Updated every 30 seconds</span>
          </div>
        </div>
        {canManageTeams && (
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowAddMemberModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Team Settings
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced System Overview - Professional Design */}
      {systemAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                  <p className="text-3xl font-bold tracking-tight">{systemAnalytics.totalTeams}</p>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">
                      {systemAnalytics.activeTeams} active
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold tracking-tight">{systemAnalytics.totalMembers}</p>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-muted-foreground">Active workforce</p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                  <p className="text-3xl font-bold tracking-tight">{Math.round(systemAnalytics.averagePerformance)}%</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <p className="text-xs text-muted-foreground">
                      {systemAnalytics.averagePerformance >= 90 ? 'Excellent' : 'Good'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                  <p className="text-3xl font-bold tracking-tight">{Math.round(systemAnalytics.averageCompliance)}%</p>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3 text-orange-500" />
                    <p className="text-xs text-muted-foreground">
                      {systemAnalytics.averageCompliance >= 95 ? 'Excellent' : 'Monitor'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Teams List with Professional Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Teams Overview</h2>
          <div className="text-sm text-muted-foreground">
            {teams.length} team{teams.length !== 1 ? 's' : ''} total
          </div>
        </div>
        
        <div className="grid gap-6">
          {teams.map((team) => (
            <EnhancedTeamCard
              key={team.id}
              team={team}
              members={teamMembers[team.id] || []}
              userRole={userRole}
              onViewDetails={() => setSelectedTeamId(team.id)}
              onManageTeam={canManageTeams ? () => setSelectedTeamId(team.id) : undefined}
            />
          ))}
          
          {teams.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first team
              </p>
              {canManageTeams && (
                <Button onClick={() => setShowAddMemberModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={selectedTeamId}
        />
      )}
    </div>
  );
}
