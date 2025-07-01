
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoleBasedDashboardData } from '@/hooks/useRoleBasedDashboardData';
import { 
  Users, 
  BookOpen, 
  Award, 
  AlertCircle,
  Shield,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminDashboardProps {
  config?: any;
  profile?: any;
}

export default function AdminDashboard({ config, profile }: AdminDashboardProps) {
  const { 
    metrics, 
    recentActivities, 
    isLoading, 
    canViewSystemMetrics 
  } = useRoleBasedDashboardData();

  // Only show admin dashboard if user has system admin permissions
  if (!canViewSystemMetrics) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600">You don't have permission to view system administration data.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
          <p className="text-muted-foreground">
            Global system metrics and administrative overview
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Access
        </Badge>
      </div>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
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
            <p className="text-xs text-gray-500 mt-1">System-wide users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
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
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
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
            <p className="text-xs text-gray-500 mt-1">All time issued</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
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
      </div>

      {/* System Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent System Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">System Activity</p>
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
              <p>No recent system activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
