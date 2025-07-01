
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  Award,
  Calendar,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';

interface TeamPerformanceDashboardProps {
  team: EnhancedTeam;
  analytics?: TeamAnalytics;
  detailed?: boolean;
}

export function TeamPerformanceDashboard({ team, analytics, detailed = false }: TeamPerformanceDashboardProps) {
  // Generate mock performance data for demonstration
  const performanceData = [
    { month: 'Jan', performance: 85, compliance: 92, satisfaction: 88 },
    { month: 'Feb', performance: 88, compliance: 94, satisfaction: 90 },
    { month: 'Mar', performance: 82, compliance: 89, satisfaction: 85 },
    { month: 'Apr', performance: 90, compliance: 96, satisfaction: 92 },
    { month: 'May', performance: 87, compliance: 93, satisfaction: 89 },
    { month: 'Jun', performance: 91, compliance: 95, satisfaction: 93 }
  ];

  const currentMetrics = team.current_metrics || {};
  const monthlyTargets = team.monthly_targets || {};

  const performanceScore = team.performance_score || 0;
  const complianceScore = currentMetrics.compliance_score || 0;
  const satisfactionScore = currentMetrics.satisfaction_score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                  {performanceScore}%
                </p>
              </div>
              <Badge variant={getScoreBadge(performanceScore)}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {performanceScore >= 85 ? 'Excellent' : performanceScore >= 70 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={performanceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                <p className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
                  {complianceScore}%
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Satisfaction</p>
                <p className={`text-2xl font-bold ${getScoreColor(satisfactionScore)}`}>
                  {satisfactionScore}%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={satisfactionScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{team.member_count || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Team Type: {team.team_type}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Performance"
              />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Compliance"
              />
              <Line 
                type="monotone" 
                dataKey="satisfaction" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Satisfaction"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Monthly Targets vs Actuals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Monthly Targets vs Actuals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Sessions</span>
                    <span>{currentMetrics.training_sessions || 0} / {monthlyTargets.training_sessions || 0}</span>
                  </div>
                  <Progress 
                    value={((currentMetrics.training_sessions || 0) / (monthlyTargets.training_sessions || 1)) * 100} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Certifications</span>
                    <span>{currentMetrics.certifications || 0} / {monthlyTargets.certifications || 0}</span>
                  </div>
                  <Progress 
                    value={((currentMetrics.certifications || 0) / (monthlyTargets.certifications || 1)) * 100} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Score</span>
                    <span>{currentMetrics.quality_score || 0}% / {monthlyTargets.quality_score || 0}%</span>
                  </div>
                  <Progress 
                    value={currentMetrics.quality_score || 0} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">By Role</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Administrators</span>
                      <Badge variant="default">
                        {team.members?.filter(m => m.role === 'ADMIN').length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Members</span>
                      <Badge variant="secondary">
                        {team.members?.filter(m => m.role === 'MEMBER').length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">By Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active</span>
                      <Badge variant="default">
                        {team.members?.filter(m => m.status === 'active').length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">On Leave</span>
                      <Badge variant="outline">
                        {team.members?.filter(m => m.status === 'on_leave').length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Team completed monthly certification target</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New team member joined</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Performance score improved by 5%</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
