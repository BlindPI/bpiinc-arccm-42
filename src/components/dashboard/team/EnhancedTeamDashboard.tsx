
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
  SwitchCamera,
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
import { TeamDashboardSelector } from './TeamDashboardSelector';
import { TeamKPICards } from './TeamKPICards';
import { TeamPerformanceComparison } from './TeamPerformanceComparison';
import { TeamActionWorkflows } from './TeamActionWorkflows';

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

  // Mock data for enhanced features (would come from API in real implementation)
  const comparisonData = {
    lastMonth: {
      teamSize: teamMetrics?.teamSize ? teamMetrics.teamSize - 2 : 0,
      activeCourses: teamMetrics?.activeCourses ? teamMetrics.activeCourses - 1 : 0,
      totalCertificates: teamMetrics?.totalCertificates ? teamMetrics.totalCertificates - 5 : 0,
      teamPerformance: teamMetrics?.teamPerformance ? teamMetrics.teamPerformance - 3 : 0,
    },
    organizationAverage: {
      team_size: 15,
      active_courses: 8,
      total_certificates: 45,
      team_performance: 82
    }
  };

  const performanceComparisonData = {
    teamData: {
      name: currentTeam?.teams?.name || 'Current Team',
      performance: teamMetrics?.teamPerformance || 0,
      rank: 3,
      totalTeams: 12,
      trends: {
        monthly: 5.2,
        quarterly: 12.8
      },
      benchmarks: {
        certificates: teamMetrics?.totalCertificates || 0,
        courses: teamMetrics?.activeCourses || 0,
        satisfaction: 4.6
      }
    },
    organizationBenchmarks: {
      avgPerformance: 82,
      topPerformingTeam: 94,
      industryAverage: 78
    },
    competitiveMetrics: [
      { teamName: 'Alpha Team', performance: 94, isCurrentTeam: false },
      { teamName: 'Beta Squad', performance: 89, isCurrentTeam: false },
      { teamName: currentTeam?.teams?.name || 'Current Team', performance: teamMetrics?.teamPerformance || 0, isCurrentTeam: true },
      { teamName: 'Delta Force', performance: 83, isCurrentTeam: false },
      { teamName: 'Gamma Group', performance: 81, isCurrentTeam: false }
    ]
  };

  const teamPermissions = {
    canScheduleCourses: currentTeamRole === 'ADMIN' || isSystemAdmin,
    canManageMembers: currentTeamRole === 'ADMIN' || isSystemAdmin,
    canIssueCertificates: true, // Most team members can issue certificates
    canViewReports: true, // All team members can view reports
    canModifySettings: currentTeamRole === 'ADMIN' || isSystemAdmin
  };

  const handleActionClick = (action: string) => {
    console.log(`Team action clicked: ${action}`);
    // Implement action handlers here
  };

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
      {/* Dashboard Control Panel */}
      <TeamDashboardSelector
        currentMode={dashboardMode}
        onModeChange={onModeChange || (() => {})}
        currentTeam={currentTeam}
        availableTeams={accessibleTeams}
        onTeamChange={onTeamChange}
        userRole={profile?.role || ''}
        isSystemAdmin={isSystemAdmin}
      />

      {/* Team Context Header */}
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

      {/* Enhanced KPI Cards */}
      <TeamKPICards 
        metrics={{
          teamSize: teamMetrics?.teamSize || 0,
          activeCourses: teamMetrics?.activeCourses || 0,
          totalCertificates: teamMetrics?.totalCertificates || 0,
          teamPerformance: teamMetrics?.teamPerformance || 0,
          monthlyProgress: teamMetrics?.monthlyProgress || 0,
          weeklyActivity: teamMetrics?.weeklyActivity || 0,
          complianceScore: 92,
          avgSatisfaction: 4.6
        }}
        comparisonData={comparisonData}
        isLoading={metricsLoading}
      />

      {/* Performance Comparison */}
      <TeamPerformanceComparison 
        teamData={performanceComparisonData.teamData}
        organizationBenchmarks={performanceComparisonData.organizationBenchmarks}
        competitiveMetrics={performanceComparisonData.competitiveMetrics}
      />

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

      {/* Team Action Workflows */}
      <TeamActionWorkflows
        teamRole={currentTeamRole || 'MEMBER'}
        teamPermissions={teamPermissions}
        onActionClick={handleActionClick}
      />
    </div>
  );
}
