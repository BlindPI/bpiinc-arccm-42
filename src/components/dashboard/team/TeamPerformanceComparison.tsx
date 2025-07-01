
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Users,
  Building2,
  BarChart3
} from 'lucide-react';

interface TeamPerformanceComparisonProps {
  teamData: {
    name: string;
    performance: number;
    rank: number;
    totalTeams: number;
    trends: {
      monthly: number;
      quarterly: number;
    };
    benchmarks: {
      certificates: number;
      courses: number;
      satisfaction: number;
    };
  };
  organizationBenchmarks: {
    avgPerformance: number;
    topPerformingTeam: number;
    industryAverage: number;
  };
  competitiveMetrics: Array<{
    teamName: string;
    performance: number;
    isCurrentTeam: boolean;
  }>;
}

export function TeamPerformanceComparison({ 
  teamData, 
  organizationBenchmarks, 
  competitiveMetrics 
}: TeamPerformanceComparisonProps) {
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return { variant: 'default' as const, label: 'Excellent' };
    if (performance >= 80) return { variant: 'secondary' as const, label: 'Good' };
    if (performance >= 70) return { variant: 'outline' as const, label: 'Average' };
    return { variant: 'destructive' as const, label: 'Needs Improvement' };
  };

  const badge = getPerformanceBadge(teamData.performance);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Team Performance Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Team Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Performance */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">{teamData.performance}%</div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <p className="text-sm text-muted-foreground">
              Ranked #{teamData.rank} of {teamData.totalTeams} teams
            </p>
          </div>

          {/* Performance vs Benchmarks */}
          <div className="space-y-4">
            <h4 className="font-medium">Performance Benchmarks</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">vs Organization Average</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(teamData.performance / organizationBenchmarks.avgPerformance) * 100} 
                    className="w-20" 
                  />
                  <span className={`text-sm font-medium ${getTrendColor(teamData.performance - organizationBenchmarks.avgPerformance)}`}>
                    {teamData.performance > organizationBenchmarks.avgPerformance ? '+' : ''}
                    {(teamData.performance - organizationBenchmarks.avgPerformance).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">vs Top Performing Team</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(teamData.performance / organizationBenchmarks.topPerformingTeam) * 100} 
                    className="w-20" 
                  />
                  <span className={`text-sm font-medium ${getTrendColor(teamData.performance - organizationBenchmarks.topPerformingTeam)}`}>
                    {teamData.performance > organizationBenchmarks.topPerformingTeam ? '+' : ''}
                    {(teamData.performance - organizationBenchmarks.topPerformingTeam).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">vs Industry Average</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(teamData.performance / organizationBenchmarks.industryAverage) * 100} 
                    className="w-20" 
                  />
                  <span className={`text-sm font-medium ${getTrendColor(teamData.performance - organizationBenchmarks.industryAverage)}`}>
                    {teamData.performance > organizationBenchmarks.industryAverage ? '+' : ''}
                    {(teamData.performance - organizationBenchmarks.industryAverage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium">Performance Trends</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(teamData.trends.monthly)}
                    <span className={`text-sm font-medium ${getTrendColor(teamData.trends.monthly)}`}>
                      {teamData.trends.monthly > 0 ? '+' : ''}{teamData.trends.monthly}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Quarterly</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(teamData.trends.quarterly)}
                    <span className={`text-sm font-medium ${getTrendColor(teamData.trends.quarterly)}`}>
                      {teamData.trends.quarterly > 0 ? '+' : ''}{teamData.trends.quarterly}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Comparison */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {competitiveMetrics.map((team, index) => (
              <div 
                key={team.teamName}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  team.isCurrentTeam 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`font-medium ${team.isCurrentTeam ? 'text-primary' : 'text-gray-900'}`}>
                      {team.teamName}
                      {team.isCurrentTeam && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Your Team
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${team.isCurrentTeam ? 'text-primary' : 'text-gray-900'}`}>
                    {team.performance}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Organization Average: {organizationBenchmarks.avgPerformance}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
