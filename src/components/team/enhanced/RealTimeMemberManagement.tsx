
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  Activity, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { skillsMatrixService } from '@/services/team/skillsMatrixService';
import { emergencyContactsService } from '@/services/team/emergencyContactsService';
import { activityMonitoringService } from '@/services/team/activityMonitoringService';
import { complianceService } from '@/services/team/complianceService';
import { toast } from 'sonner';

interface RealTimeMemberManagementProps {
  teamId: string;
  userId?: string;
}

export function RealTimeMemberManagement({ teamId, userId }: RealTimeMemberManagementProps) {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string>('');

  // Real-time activity stats
  const { data: activityStats, isLoading: statsLoading } = useQuery({
    queryKey: ['realtime-activity-stats'],
    queryFn: () => activityMonitoringService.getRealtimeActivityStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Team compliance overview
  const { data: complianceOverview, isLoading: complianceLoading } = useQuery({
    queryKey: ['team-compliance', teamId],
    queryFn: () => complianceService.getTeamComplianceOverview(teamId),
    refetchInterval: 60000 // Refresh every minute
  });

  // Skills matrix
  const { data: skillsMatrix, isLoading: skillsLoading } = useQuery({
    queryKey: ['team-skills-matrix', teamId],
    queryFn: () => skillsMatrixService.getTeamSkillsMatrix(teamId)
  });

  // Team activity logs
  const { data: teamActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: () => activityMonitoringService.getTeamActivityLogs(teamId, 50),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Log activity when component mounts
  useEffect(() => {
    if (userId) {
      activityMonitoringService.logActivity(
        userId,
        'team_management_view',
        `Viewed team management for team ${teamId}`,
        { team_id: teamId }
      );
    }
  }, [teamId, userId]);

  const getComplianceStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage >= 70) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (statsLoading || complianceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Activity Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users Today</p>
                <p className="text-3xl font-bold">{activityStats?.activeUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Compliance</p>
                <p className={`text-3xl font-bold ${getComplianceStatusColor(complianceOverview?.teamCompliance || 0)}`}>
                  {Math.round(complianceOverview?.teamCompliance || 0)}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activities Today</p>
                <p className="text-3xl font-bold">{activityStats?.totalActivitiesToday || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
          <TabsTrigger value="activity">Real-time Activity</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Team Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complianceOverview?.memberSummaries?.length > 0 ? (
                <div className="space-y-4">
                  {complianceOverview.memberSummaries.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getComplianceStatusIcon(member.compliance_percentage)}
                        <div>
                          <p className="font-medium">{member.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.non_compliant_count} non-compliant items
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <Progress value={member.compliance_percentage} className="h-2" />
                        </div>
                        <Badge 
                          variant={member.compliance_percentage >= 90 ? 'default' : 'destructive'}
                          className="min-w-[60px] justify-center"
                        >
                          {Math.round(member.compliance_percentage)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No compliance data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Team Skills Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skillsMatrix?.length > 0 ? (
                <div className="space-y-4">
                  {skillsMatrix.map((member) => (
                    <div key={member.user_id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{member.display_name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.length > 0 ? (
                          member.skills.map((skill) => (
                            <Badge 
                              key={skill.id} 
                              variant={skill.certified ? 'default' : 'secondary'}
                              className="flex items-center gap-1"
                            >
                              {skill.skill_name}
                              <span className="text-xs">
                                ({skill.proficiency_level}/5)
                              </span>
                              {skill.certified && <CheckCircle className="h-3 w-3" />}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills recorded</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No skills data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamActivity?.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {teamActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.activity_description || activity.activity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Activities Today */}
          {activityStats?.topActivities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Activities Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activityStats.topActivities.map((activity, index) => (
                    <div key={activity.activity_type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                      <Badge variant="outline">{activity.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contacts Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Emergency contact management requires individual member access. 
                  Select a team member to view and manage their emergency contacts.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Team-wide emergency contact overview and validation tools will be available here.
                  Individual management is accessible through member profiles.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
