
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Activity, 
  Shield, 
  Search,
  UserPlus,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ActivityMonitoringService } from '@/services/monitoring/activityMonitoringService';
import { ComplianceService } from '@/services/compliance/complianceService';
import { SkillsMatrixService } from '@/services/skills/skillsMatrixService';
import { toast } from 'sonner';

interface RealTimeMemberManagementProps {
  teamId: string;
}

export function RealTimeMemberManagement({ teamId }: RealTimeMemberManagementProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Real-time activity stats
  const { data: activityStats } = useQuery({
    queryKey: ['team-activity-stats', teamId],
    queryFn: () => ActivityMonitoringService.getRealtimeActivityStats(teamId),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Team compliance overview
  const { data: complianceData } = useQuery({
    queryKey: ['team-compliance', teamId],
    queryFn: () => ComplianceService.getTeamComplianceOverview(teamId),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Skills matrix
  const { data: skillsMatrix } = useQuery({
    queryKey: ['team-skills-matrix', teamId],
    queryFn: () => SkillsMatrixService.getTeamSkillsMatrix(teamId),
    refetchInterval: 600000 // Refresh every 10 minutes
  });

  // Activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['team-activity-logs', teamId],
    queryFn: () => ActivityMonitoringService.getTeamActivityLogs(teamId, 50),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Log activity mutation
  const logActivityMutation = useMutation({
    mutationFn: ({ userId, activityType, description }: { userId: string; activityType: string; description?: string }) =>
      ActivityMonitoringService.logActivity(userId, activityType, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-activity-logs', teamId] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Member Management</h2>
          <p className="text-muted-foreground">
            Monitor team activity, compliance, and skills in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{activityStats?.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">{Math.round(complianceData?.overallComplianceRate || 0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Skills</p>
                <p className="text-2xl font-bold">{skillsMatrix?.averageProficiency?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members by name, role, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Management Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{activityStats?.totalSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{complianceData?.compliantMembers || 0}</p>
                  <p className="text-sm text-muted-foreground">Compliant Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{skillsMatrix?.totalSkills || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Skills</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{activityStats?.averageSessionDuration || 0}m</p>
                  <p className="text-sm text-muted-foreground">Avg. Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">User {log.user_id}</span> {log.activity_description || log.activity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.activity_type}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{complianceData.compliantMembers}</p>
                      <p className="text-sm text-muted-foreground">Compliant</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{complianceData.pendingMembers}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{complianceData.nonCompliantMembers}</p>
                      <p className="text-sm text-muted-foreground">Non-Compliant</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading compliance data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {skillsMatrix ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{skillsMatrix.totalSkills}</p>
                      <p className="text-sm text-muted-foreground">Total Skills</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{skillsMatrix.averageProficiency.toFixed(1)}/5</p>
                      <p className="text-sm text-muted-foreground">Avg. Proficiency</p>
                    </div>
                  </div>
                  
                  {skillsMatrix.skillGaps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skill Gaps</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillsMatrix.skillGaps.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading skills data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
