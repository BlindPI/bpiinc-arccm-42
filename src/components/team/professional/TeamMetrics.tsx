
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, MapPin, Activity } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  locations?: {
    name: string;
  };
}

interface TeamMetricsProps {
  teams: Team[];
}

export function TeamMetrics({ teams }: TeamMetricsProps) {
  const metrics = React.useMemo(() => {
    const statusCounts = teams.reduce((acc, team) => {
      acc[team.status] = (acc[team.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = teams.reduce((acc, team) => {
      const type = team.team_type || 'standard';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgPerformance = teams.length > 0 
      ? teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length
      : 0;

    const topPerformers = teams
      .filter(team => team.performance_score && team.performance_score > 0)
      .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
      .slice(0, 5);

    return {
      statusCounts,
      typeCounts,
      avgPerformance,
      topPerformers
    };
  }, [teams]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'provider_team': return 'bg-blue-100 text-blue-800';
      case 'training_team': return 'bg-purple-100 text-purple-800';
      case 'operations': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={getStatusColor(status)}>
                    {status}
                  </Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge className={getTypeColor(type)}>
                    {type.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {metrics.avgPerformance.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Average Performance Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topPerformers.map((team, index) => (
              <div 
                key={team.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {team.locations?.name || 'No location'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">
                    {team.performance_score?.toFixed(1)}%
                  </div>
                  <Badge className={getTypeColor(team.team_type || 'standard')}>
                    {team.team_type?.replace('_', ' ') || 'Standard'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {metrics.topPerformers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No performance data available yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
