
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  MapPin, 
  Switch,
  Eye,
  BarChart3,
  Calendar,
  Settings,
  Shield
} from 'lucide-react';
import { useEnhancedTeamContext } from '@/hooks/useEnhancedTeamContext';
import { useQuery } from '@tanstack/react-query';
import { TeamScopedDataService } from '@/services/team/teamScopedDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface EnhancedTeamDashboardProps {
  selectedTeamId?: string;
  onTeamChange?: (teamId: string) => void;
  dashboardMode?: 'personal' | 'team' | 'organization';
  onModeChange?: (mode: 'personal' | 'team' | 'organization') => void;
}

export function EnhancedTeamDashboard({ 
  selectedTeamId, 
  onTeamChange,
  dashboardMode = 'team',
  onModeChange 
}: EnhancedTeamDashboardProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const {
    currentTeam,
    currentTeamRole,
    allTeams,
    isSystemAdmin,
    canSwitchTeams,
    shouldRestrictData
  } = useEnhancedTeamContext(selectedTeamId);

  // Get accessible teams for switching
  const { data: accessibleTeams = [] } = useQuery({
    queryKey: ['accessible-teams', user?.id],
    queryFn: () => TeamScopedDataService.getUserAccessibleTeams(user?.id || ''),
    enabled: !!user?.id && canSwitchTeams
  });

  // Get team metrics with proper access control
  const { data: teamMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['team-metrics', currentTeam?.team_id, user?.id],
    queryFn: () => TeamScopedDataService.getTeamMetrics(
      currentTeam?.team_id || '',
      user?.id || '',
      profile?.role || ''
    ),
    enabled: !!currentTeam?.team_id && !!user?.id && !!profile?.role
  });

  // Get team courses
  const { data: teamCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['team-courses', currentTeam?.team_id, user?.id],
    queryFn: () => TeamScopedDataService.getTeamCourses(
      currentTeam?.team_id || '',
      user?.id || ''
    ),
    enabled: !!currentTeam?.team_id && !!user?.id
  });

  // Get team certificates
  const { data: teamCertificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ['team-certificates', currentTeam?.team_id, user?.id],
    queryFn: () => TeamScopedDataService.getTeamCertificates(
      currentTeam?.team_id || '',
      user?.id || ''
    ),
    enabled: !!currentTeam?.team_id && !!user?.id
  });

  if (!currentTeam) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Team Selected</h3>
          <p className="text-muted-foreground mb-4">
            {allTeams.length > 0 
              ? 'Please select a team to view team-specific data.'
              : 'You are not a member of any teams yet.'
            }
          </p>
          {allTeams.length === 0 && !isSystemAdmin && (
            <Button variant="outline">
              Request Team Access
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Context Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              Team Dashboard - {currentTeam?.teams?.name || 'Current Team'}
              {teamMetrics?.locationName && (
                <span className="ml-2 text-blue-600">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {teamMetrics.locationName}
                </span>
              )}
              <Badge variant="outline" className="ml-2">
                {currentTeamRole}
              </Badge>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex items-center gap-3">
          {/* Dashboard Mode Selector */}
          {(isSystemAdmin || currentTeamRole === 'ADMIN') && (
            <Select value={dashboardMode} onValueChange={onModeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal View</SelectItem>
                <SelectItem value="team">Team View</SelectItem>
                {isSystemAdmin && (
                  <SelectItem value="organization">Organization View</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          {/* Team Switcher */}
          {canSwitchTeams && accessibleTeams.length > 1 && (
            <Select value={currentTeam?.team_id} onValueChange={onTeamChange}>
              <SelectTrigger className="w-[200px]">
                <Switch className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accessibleTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex flex-col">
                      <span>{team.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {team.role} • {team.location_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Team Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamMetrics?.teamSize || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamMetrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduled courses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamMetrics?.totalCertificates || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total issued</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{teamMetrics?.teamPerformance || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Team score</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Data Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Courses */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Team Courses
              </span>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="text-center py-4">Loading courses...</div>
            ) : teamCourses.length > 0 ? (
              <div className="space-y-3">
                {teamCourses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-blue-900">{course.name}</h4>
                      <p className="text-sm text-blue-600">
                        {new Date(course.start_date).toLocaleDateString()} - {course.instructor_name}
                      </p>
                    </div>
                    <Badge variant={course.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No courses scheduled</p>
            )}
          </CardContent>
        </Card>

        {/* Team Certificates */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Certificates
              </span>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificatesLoading ? (
              <div className="text-center py-4">Loading certificates...</div>
            ) : teamCertificates.length > 0 ? (
              <div className="space-y-3">
                {teamCertificates.slice(0, 5).map((cert) => (
                  <div key={cert.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-green-900">{cert.recipient_name}</h4>
                      <p className="text-sm text-green-600">{cert.course_name}</p>
                    </div>
                    <span className="text-xs text-green-700">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No certificates issued</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="text-sm">Schedule Course</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2 text-green-600" />
              <span className="text-sm">Manage Members</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Award className="h-6 w-6 mb-2 text-purple-600" />
              <span className="text-sm">Issue Certificate</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <BarChart3 className="h-6 w-6 mb-2 text-amber-600" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
