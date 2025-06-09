
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemAdminDashboardData } from '@/hooks/dashboard/useSystemAdminDashboardData';
import { Users, BookOpen, Award, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { InlineLoader } from '@/components/ui/LoadingStates';
import type { UserProfile } from '@/types/auth';
import type { DashboardConfig } from '@/hooks/useDashboardConfig';

interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const SystemAdminDashboard = ({ config, profile }: SystemAdminDashboardProps) => {
  const { metrics, recentActivities, isLoading, error } = useSystemAdminDashboardData();

  if (isLoading) {
    return <InlineLoader message="Loading system admin dashboard..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Error</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administrator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.display_name}. Here's your system overview.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.totalCertificates || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total issued</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.pendingRequests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">{metrics?.systemHealth?.status || 'Healthy'}</span>
            </div>
            <div className="text-sm text-gray-500">
              {metrics?.systemHealth?.message || 'All systems operational'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent System Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{activity.type}</p>
                    <p className="text-gray-500 text-xs">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAdminDashboard;
