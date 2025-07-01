
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoleBasedDashboardData } from '@/hooks/useRoleBasedDashboardData';
import { useProfile } from '@/hooks/useProfile';
import { LoadingDashboard } from './LoadingDashboard';
import {
  Users,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  MapPin,
  AlertCircle,
  Activity,
  Shield,
  Mail,
  Phone,
  Building2
} from 'lucide-react';

export function RoleBasedDashboard() {
  const { data: profile } = useProfile();
  const { 
    metrics, 
    recentActivities, 
    isLoading, 
    error, 
    canViewSystemMetrics, 
    canViewTeamMetrics,
    teamContext 
  } = useRoleBasedDashboardData();

  if (isLoading) {
    return <LoadingDashboard message="Loading your personalized dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Dashboard Error</h3>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDashboardTitle = () => {
    if (canViewSystemMetrics) {
      return 'System Administration Dashboard';
    }
    if (canViewTeamMetrics && teamContext) {
      return `${teamContext.teamName} Dashboard`;
    }
    return 'Personal Dashboard';
  };

  const getMetricCards = () => {
    const cards = [];

    if (canViewSystemMetrics) {
      // System Admin Metrics
      cards.push(
        <Card key="total-users">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">System-wide</p>
          </CardContent>
        </Card>,
        <Card key="active-courses">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.activeCourses || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>,
        <Card key="total-certificates">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalCertificates || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>,
        <Card key="pending-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.pendingRequests || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>
      );
    } else if (canViewTeamMetrics) {
      // Team Member Metrics
      cards.push(
        <Card key="team-size">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.teamSize || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active members</p>
          </CardContent>
        </Card>,
        <Card key="location">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-green-600">
              {metrics.locationName || 'No Location'}
            </div>
            {metrics.locationCity && metrics.locationState && (
              <p className="text-sm text-gray-600 mt-1">
                {metrics.locationCity}, {metrics.locationState}
              </p>
            )}
            {metrics.locationAddress && (
              <p className="text-xs text-gray-500 mt-1">{metrics.locationAddress}</p>
            )}
          </CardContent>
        </Card>
      );
      
      // AP User Card (if available)
      if (metrics.apUserName) {
        cards.push(
          <Card key="ap-user">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Account Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium text-blue-600">
                {metrics.apUserName}
              </div>
              {metrics.apUserEmail && (
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {metrics.apUserEmail}
                </p>
              )}
              {metrics.apUserPhone && (
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.apUserPhone}
                </p>
              )}
            </CardContent>
          </Card>
        );
      }
      
      // Certificate and Course cards
      cards.push(
        <Card key="team-certificates">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Team Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalCertificates || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Location total</p>
          </CardContent>
        </Card>,
        <Card key="team-courses">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.activeCourses || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Location courses</p>
          </CardContent>
        </Card>
      );
    } else {
      // Personal Metrics (Instructors/Students)
      if (['IC', 'IP', 'IT'].includes(profile?.role || '')) {
        // Instructor metrics
        cards.push(
          <Card key="upcoming-classes">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.upcomingClasses || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Next 14 days</p>
            </CardContent>
          </Card>,
          <Card key="students-taught">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students Taught
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.studentsTaught || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </CardContent>
          </Card>,
          <Card key="certifications-issued">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certificates Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.certificationsIssued || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </CardContent>
          </Card>,
          <Card key="teaching-hours">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Teaching Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.teachingHours || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 3 months</p>
            </CardContent>
          </Card>
        );
      } else {
        // Student/Other metrics
        cards.push(
          <Card key="active-courses">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.activeCourses || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
            </CardContent>
          </Card>,
          <Card key="certifications">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Active Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.activeCertifications || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current valid</p>
            </CardContent>
          </Card>,
          <Card key="expiring-soon">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.expiringSoon || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Next 60 days</p>
            </CardContent>
          </Card>
        );
      }
    }

    return cards;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getDashboardTitle()}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {profile?.role}
            </Badge>
            {teamContext && (
              <>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {teamContext.locationName}
                </Badge>
                {teamContext.apUserName && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    AP: {teamContext.apUserName}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {getMetricCards()}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.user_name && (
                      <p className="text-xs text-muted-foreground">by {activity.user_name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activities to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
