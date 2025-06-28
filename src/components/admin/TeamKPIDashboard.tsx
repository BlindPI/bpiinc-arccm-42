
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { TeamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { TeamKPIMetrics } from './TeamKPIMetrics';
import { RefreshCw, Download, Filter, Users, BarChart3 } from 'lucide-react';
import { GlobalAnalytics, TeamAnalyticsSummary, TeamGoal } from '@/types/analytics';

export function TeamKPIDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: globalAnalytics, isLoading: globalLoading, refetch: refetchGlobal } = useQuery({
    queryKey: ['global-analytics'],
    queryFn: async (): Promise<GlobalAnalytics> => {
      const analytics = await TeamAnalyticsService.getGlobalAnalytics();
      
      // Transform the data to match expected interface
      return {
        totalUsers: analytics?.totalUsers || 0,
        activeSessions: analytics?.activeSessions || 0,
        completionRate: analytics?.completionRate || 0,
        complianceScore: analytics?.complianceScore || 0,
        topPerformingTeams: (analytics?.topPerformingTeams || []).map(team => ({
          id: team.id || team.team_id || 'unknown',
          name: team.name || team.team_name || 'Unknown Team',
          performance: team.performance || team.average_performance || 0,
          memberCount: team.memberCount || team.member_count || team.total_members || 0
        }))
      };
    }
  });

  const { data: teamGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ['team-goals', selectedTeamId],
    queryFn: async (): Promise<TeamGoal[]> => {
      const goals = await TeamAnalyticsService.getTeamGoals(selectedTeamId === 'all' ? '1' : selectedTeamId);
      
      // Transform goals to match expected interface
      return (goals || []).map(goal => ({
        id: goal.id,
        title: goal.title || goal.name || 'Unnamed Goal',
        progress: goal.progress || goal.current_value || 0,
        target: goal.target || goal.target_value || 100,
        status: goal.status as 'on_track' | 'at_risk' | 'behind' || 'on_track'
      }));
    },
    enabled: selectedTeamId !== 'all'
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchGlobal();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const teamSummaries: TeamAnalyticsSummary[] = globalAnalytics?.topPerformingTeams || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team KPI Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor team performance and key metrics across the organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TeamKPIMetrics
            globalAnalytics={globalAnalytics}
            teamSummaries={teamSummaries}
            teamGoals={teamGoals || []}
            isLoading={globalLoading || goalsLoading}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Team Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed performance analytics</p>
                <p className="text-sm">Performance trends and comparative analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Goals & Targets Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Team goals and target management</p>
                <p className="text-sm">Set and track team objectives</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
