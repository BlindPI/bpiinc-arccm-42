
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';
import { ComprehensiveDashboardService, type SystemAdminMetrics } from '@/services/dashboard/comprehensiveDashboardService';

export const SystemAdminDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['system-admin-dashboard'],
    queryFn: () => ComprehensiveDashboardService.getSystemAdminDashboard(),
    refetchInterval: 60000 // Refresh every minute
  });

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
            <span className="text-red-800">Failed to load dashboard data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getHealthStatus = (value: number, threshold: number, isInverse: boolean = false) => {
    const isHealthy = isInverse ? value <= threshold : value >= threshold;
    return isHealthy ? 'healthy' : value >= threshold * 0.8 ? 'warning' : 'critical';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active ({Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeCourses} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCertificates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeCertificates} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemUptime}%</div>
            <p className="text-xs text-green-600">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.systemHealth.map((health) => (
              <div key={health.component} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{health.component}</span>
                  <Badge variant={
                    health.status === 'healthy' ? 'default' :
                    health.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {health.status}
                  </Badge>
                </div>
                <Progress 
                  value={health.component === 'Error Rate' ? 
                    Math.max(0, 100 - (health.value / health.threshold) * 100) :
                    (health.value / health.threshold) * 100
                  } 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {health.value}{health.component === 'API Response Time' ? 'ms' : 
                    health.component === 'Error Rate' ? '%' : '%'} 
                  (Threshold: {health.threshold}{health.component === 'API Response Time' ? 'ms' : '%'})
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pending Approvals</span>
              </div>
              <Badge variant="secondary">{metrics.pendingApprovals}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Critical Issues</span>
              </div>
              <Badge variant="destructive">{metrics.criticalIssues}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Compliance Score</span>
              </div>
              <Badge variant="default">{metrics.complianceScore}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.userGrowthMetrics.map((growth) => (
              <div key={growth.period} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {growth.period.replace('_', ' ')}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold">{growth.userGrowth}</div>
                    <div className="text-muted-foreground">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{growth.courseCompletions}</div>
                    <div className="text-muted-foreground">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{growth.certificateIssuance}</div>
                    <div className="text-muted-foreground">Certs</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent System Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentActivities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.severity === 'critical' ? 'bg-red-500' :
                    activity.severity === 'high' ? 'bg-orange-500' :
                    activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{activity.type.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
