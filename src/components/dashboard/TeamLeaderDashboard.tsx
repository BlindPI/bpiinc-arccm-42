import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Award, 
  BookOpen, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react';
import { ComprehensiveDashboardService, type TeamLeaderMetrics } from '@/services/dashboard/comprehensiveDashboardService';
import { useTeamContext } from '@/hooks/useTeamContext';

export const TeamLeaderDashboard: React.FC = () => {
  const { primaryTeam } = useTeamContext();
  
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['team-leader-dashboard', primaryTeam?.team_id],
    queryFn: () => primaryTeam?.team_id ? 
      ComprehensiveDashboardService.getTeamLeaderDashboard(primaryTeam.team_id) : 
      Promise.reject('No team ID available'),
    enabled: !!primaryTeam?.team_id,
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (!primaryTeam?.team_id) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">No team assignment found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to load team dashboard data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const complianceStatus = metrics.complianceRate >= 95 ? 'excellent' :
                          metrics.complianceRate >= 85 ? 'good' :
                          metrics.complianceRate >= 75 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {metrics.teamName} - Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.memberCount}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.activeMembers}</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.teamPerformance}</div>
              <div className="text-sm text-muted-foreground">Team Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.complianceRate}%</div>
              <div className="text-sm text-muted-foreground">Compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.certificatesIssued}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.coursesCompleted}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trainingHours}</div>
            <p className="text-xs text-muted-foreground">Total delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceRate}%</div>
            <Badge variant={
              complianceStatus === 'excellent' ? 'default' :
              complianceStatus === 'good' ? 'secondary' :
              complianceStatus === 'warning' ? 'outline' : 'destructive'
            }>
              {complianceStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Member Performance</span>
            <Button variant="outline" size="sm">
              View All Members
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.memberPerformance.slice(0, 5).map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.userName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.userName}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.performanceScore}%</p>
                    <p className="text-xs text-muted-foreground">{member.completedTraining} courses</p>
                  </div>
                  <Badge variant={
                    member.complianceStatus === 'compliant' ? 'default' :
                    member.complianceStatus === 'at_risk' ? 'secondary' : 'destructive'
                  }>
                    {member.complianceStatus.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines & Recent Achievements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {metrics.upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      deadline.priority === 'high' ? 'destructive' :
                      deadline.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {deadline.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No upcoming deadlines</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentAchievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{achievement.title}</p>
                      <p className="text-sm text-green-600">
                        {achievement.userName} - {new Date(achievement.achievedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent achievements</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;
