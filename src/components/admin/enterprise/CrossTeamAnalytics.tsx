
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Building2, Target } from 'lucide-react';
import { RealTeamDataService } from '@/services/team/realTeamDataService';

export function CrossTeamAnalytics() {
  const { data: teamAnalytics, isLoading } = useQuery({
    queryKey: ['cross-team-analytics'],
    queryFn: () => RealTeamDataService.getTeamAnalytics()
  });

  const { data: teams } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => RealTeamDataService.getEnhancedTeams()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Cross-Team Analytics</h2>
        <p className="text-muted-foreground">
          System-wide team performance and collaboration metrics
        </p>
      </div>

      {/* Overview Metrics */}
      {teamAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-3xl font-bold">{teamAnalytics.totalTeams}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold">{teamAnalytics.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-3xl font-bold">{Math.round(teamAnalytics.averagePerformance)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-3xl font-bold">{Math.round(teamAnalytics.averageCompliance)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Teams by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {teamAnalytics?.teamsByLocation && Object.keys(teamAnalytics.teamsByLocation).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(teamAnalytics.teamsByLocation).map(([location, count]) => (
                <div key={location} className="flex justify-between items-center">
                  <span>{location}</span>
                  <Badge variant="outline">{count} teams</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No location data available</p>
          )}
        </CardContent>
      </Card>

      {/* Performance by Team Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Team Type</CardTitle>
        </CardHeader>
        <CardContent>
          {teamAnalytics?.performanceByTeamType && Object.keys(teamAnalytics.performanceByTeamType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(teamAnalytics.performanceByTeamType).map(([type, performance]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{Math.round(Number(performance))}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Team Status Overview */}
      {teams && (
        <Card>
          <CardHeader>
            <CardTitle>Team Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.slice(0, 6).map((team) => (
                <div key={team.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{team.name}</h3>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {team.location?.name || 'No location'}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>Performance:</span>
                    <span className="font-medium">{Math.round(team.performance_score)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
