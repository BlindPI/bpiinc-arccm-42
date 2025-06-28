
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Target, Award, Activity } from 'lucide-react';
import { TeamAnalyticsSummary, GlobalAnalytics, TeamGoal } from '@/services/team/teamAnalyticsService';

interface TeamKPIMetricsProps {
  globalAnalytics: GlobalAnalytics | undefined;
  teamSummaries: TeamAnalyticsSummary[];
  teamGoals: TeamGoal[];
  isLoading: boolean;
}

export function TeamKPIMetrics({ globalAnalytics, teamSummaries, teamGoals, isLoading }: TeamKPIMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatTrendValue = (current: number, previous?: number) => {
    if (!previous) return { value: 0, direction: 'stable' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 : 'down' as const : 'stable' as const
    };
  };

  return (
    <div className="space-y-6">
      {/* Global KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {globalAnalytics?.totalTeams || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active teams</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {globalAnalytics?.totalMembers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Team members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {globalAnalytics?.overallPerformance || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Average performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {globalAnalytics?.topPerformingTeams?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">High performing teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Goals Progress */}
      {teamGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Team Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamGoals.map((goal) => {
                const progressPercentage = (goal.currentValue / goal.targetValue) * 100;
                const isOverdue = new Date(goal.dueDate) < new Date() && goal.status !== 'completed';
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{goal.title || goal.goalName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {goal.description || 'Goal progress tracking'}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          goal.status === 'completed' ? 'default' : 
                          isOverdue ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPercentage} className="flex-1" />
                      <span className="text-sm font-medium min-w-[60px] text-right">
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {Math.round(progressPercentage)}%</span>
                      <span>Due: {new Date(goal.target_date || goal.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teamSummaries.slice(0, 4).map((team) => {
              const performanceTrend = formatTrendValue(
                team.current_period?.performance || team.performanceScore,
                80 // Mock previous value
              );
              const completionTrend = formatTrendValue(
                team.current_period?.completion || team.completionRate,
                75 // Mock previous value  
              );
              const activityTrend = formatTrendValue(
                team.current_period?.activity || team.recentActivity,
                10 // Mock previous value
              );
              const growthTrend = formatTrendValue(
                team.current_period?.growth || 5,
                3 // Mock previous value
              );

              return (
                <div key={team.teamId} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{team.teamName}</h4>
                    <Badge variant="outline">{team.memberCount} members</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {team.current_period?.performance || team.performanceScore}%
                        </span>
                        {performanceTrend.direction !== 'stable' && (
                          <div className={`flex items-center gap-1 text-xs ${
                            performanceTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {performanceTrend.direction === 'up' ? 
                              <TrendingUp className="h-3 w-3" /> : 
                              <TrendingDown className="h-3 w-3" />
                            }
                            {performanceTrend.value.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {team.current_period?.completion || team.completionRate}%
                        </span>
                        {completionTrend.direction !== 'stable' && (
                          <div className={`flex items-center gap-1 text-xs ${
                            completionTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {completionTrend.direction === 'up' ? 
                              <TrendingUp className="h-3 w-3" /> : 
                              <TrendingDown className="h-3 w-3" />
                            }
                            {completionTrend.value.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Activity</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {team.current_period?.activity || team.recentActivity}
                        </span>
                        {activityTrend.direction !== 'stable' && (
                          <div className={`flex items-center gap-1 text-xs ${
                            activityTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activityTrend.direction === 'up' ? 
                              <TrendingUp className="h-3 w-3" /> : 
                              <TrendingDown className="h-3 w-3" />
                            }
                            {activityTrend.value.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Growth</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {team.current_period?.growth || 5}%
                        </span>
                        {growthTrend.direction !== 'stable' && (
                          <div className={`flex items-center gap-1 text-xs ${
                            growthTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {growthTrend.direction === 'up' ? 
                              <TrendingUp className="h-3 w-3" /> : 
                              <TrendingDown className="h-3 w-3" />
                            }
                            {growthTrend.value.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
