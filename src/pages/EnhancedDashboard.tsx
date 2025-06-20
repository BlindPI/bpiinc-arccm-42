
import React from 'react';
import { useEnhancedRoleBasedDashboardData } from '@/hooks/useEnhancedRoleBasedDashboardData';
import { EnhancedDashboardStatusCard } from '@/components/dashboard/enhanced/EnhancedDashboardStatusCard';
import { DashboardIntegrityPanel } from '@/components/dashboard/admin/DashboardIntegrityPanel';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  MapPin, 
  Award, 
  TrendingUp,
  AlertTriangle,
  Building2,
  Activity
} from 'lucide-react';

export default function EnhancedDashboard() {
  const { data: profile } = useProfile();
  const {
    metrics,
    recentActivities,
    isLoading,
    error,
    canViewSystemMetrics,
    dashboardType,
    healthStatus,
    issues,
    recommendations,
    teamContext
  } = useEnhancedRoleBasedDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Enhanced Status Card */}
      <EnhancedDashboardStatusCard
        dashboardType={dashboardType}
        healthStatus={healthStatus}
        issues={issues}
        recommendations={recommendations}
        teamContext={teamContext}
      />

      {/* Admin Integrity Panel */}
      {canViewSystemMetrics && (
        <DashboardIntegrityPanel />
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Render metrics based on dashboard type */}
        {dashboardType === 'ap_enhanced' && 'totalTeams' in metrics && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Teams Managed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTeams}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.hasLocationAssignment ? 'Location-based' : 'Team-based'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                <p className="text-xs text-muted-foreground">Across all teams</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCertificates}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.recentCertificates} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.healthScore}%</div>
                <Badge variant={healthStatus === 'healthy' ? 'default' : 'secondary'}>
                  {healthStatus}
                </Badge>
              </CardContent>
            </Card>
          </>
        )}

        {dashboardType === 'team_enhanced' && 'totalMembers' in metrics && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.adminMembers} admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.certificatesIssued}</div>
                <p className="text-xs text-muted-foreground">Issued</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.averagePerformance}%</div>
                <p className="text-xs text-muted-foreground">Average score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.complianceScore}%</div>
                <Badge variant={metrics.complianceScore > 80 ? 'default' : 'secondary'}>
                  {metrics.complianceScore > 80 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Team Breakdown for AP Users */}
      {dashboardType === 'ap_enhanced' && 'teamBreakdown' in metrics && metrics.teamBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.teamBreakdown.map((team) => (
                <div key={team.teamId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{team.teamName}</h3>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {team.memberCount} members
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Details for Team Users */}
      {dashboardType === 'team_enhanced' && 'memberDetails' in metrics && metrics.memberDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.memberDetails.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{member.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'outline'}>
                      {member.role}
                    </Badge>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
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
