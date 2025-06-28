
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TeamKPIMetricsProps {
  globalAnalytics?: {
    totalUsers: number;
    activeSessions: number;
    completionRate: number;
    complianceScore: number;
    topPerformingTeams: Array<{
      id: string;
      name: string;
      performance: number;
      memberCount: number;
    }>;
  };
  teamSummaries: Array<{
    id: string;
    name: string;
    performance: number;
    memberCount: number;
  }>;
  teamGoals: Array<{
    id: string;
    title: string;
    progress: number;
    target: number;
    status: 'on_track' | 'at_risk' | 'behind';
  }>;
  isLoading: boolean;
}

export function TeamKPIMetrics({ 
  globalAnalytics, 
  teamSummaries, 
  teamGoals, 
  isLoading 
}: TeamKPIMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalUsers = globalAnalytics?.totalUsers || 0;
  const activeSessions = globalAnalytics?.activeSessions || 0;
  const overallCompletionRate = globalAnalytics?.completionRate || 0;
  const complianceScore = globalAnalytics?.complianceScore || 0;

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently ongoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletionRate.toFixed(1)}%</div>
            <Progress value={overallCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore.toFixed(1)}%</div>
            <Badge variant={complianceScore >= 80 ? "default" : "destructive"}>
              {complianceScore >= 80 ? "Good" : "Needs Attention"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Performing Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamSummaries.length > 0 ? (
            <div className="space-y-4">
              {teamSummaries.slice(0, 5).map((team) => (
                <div key={team.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.memberCount} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={team.performance} className="w-20" />
                    <span className="text-sm font-medium">
                      {team.performance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Team Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamGoals.length > 0 ? (
            <div className="space-y-4">
              {teamGoals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{goal.title}</p>
                    <Badge 
                      variant={
                        goal.status === 'on_track' ? 'default' :
                        goal.status === 'at_risk' ? 'secondary' : 'destructive'
                      }
                    >
                      {goal.status === 'on_track' ? 'On Track' :
                       goal.status === 'at_risk' ? 'At Risk' : 'Behind'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={(goal.progress / goal.target) * 100} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {goal.progress}/{goal.target}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team goals configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
