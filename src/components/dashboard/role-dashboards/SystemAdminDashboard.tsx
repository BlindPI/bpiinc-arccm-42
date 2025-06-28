
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RealTimeDashboardWidget } from '../RealTimeDashboardWidget';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  Database,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SystemAdminDashboardProps {
  config: any;
  profile: any;
}

export default function SystemAdminDashboard({ config, profile }: SystemAdminDashboardProps) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['system-admin-metrics'],
    queryFn: () => DashboardDataService.getSystemAdminMetrics(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['system-admin-activities'],
    queryFn: () => DashboardDataService.getRecentActivities(profile.id, 'SA'),
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <div className="space-y-6">
      {/* Real-time System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RealTimeDashboardWidget
          title="Total Users"
          icon={Users}
          value={metrics?.totalUsers}
          status="info"
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />

        <RealTimeDashboardWidget
          title="Active Users"
          icon={Activity}
          value={metrics?.activeUsers}
          status="success"
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />

        <RealTimeDashboardWidget
          title="Pending Approvals"
          icon={Clock}
          value={metrics?.pendingApprovals}
          status={metrics?.pendingApprovals > 5 ? "warning" : "success"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
          actions={[
            { label: 'View All', onClick: () => window.location.href = '/certificate-requests' }
          ]}
        />

        <RealTimeDashboardWidget
          title="System Health"
          icon={Server}
          value={`${metrics?.systemHealth?.healthy || 0}/${(metrics?.systemHealth?.healthy || 0) + (metrics?.systemHealth?.warning || 0) + (metrics?.systemHealth?.critical || 0)}`}
          status={metrics?.systemHealth?.critical > 0 ? "error" : metrics?.systemHealth?.warning > 0 ? "warning" : "success"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />
      </div>

      {/* System Health Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeDashboardWidget
          title="System Components"
          icon={Database}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Services</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            {metrics?.systemHealth?.warning > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Jobs</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Warning
                </Badge>
              </div>
            )}
          </div>
        </RealTimeDashboardWidget>

        <RealTimeDashboardWidget
          title="Recent System Activity"
          icon={Shield}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentActivities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.entity_type}
                </Badge>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </RealTimeDashboardWidget>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/users'}
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">User Management</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/certificate-requests'}
              className="h-20 flex flex-col gap-2"
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Approvals</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/settings'}
              className="h-20 flex flex-col gap-2"
            >
              <Server className="h-6 w-6" />
              <span className="text-sm">System Settings</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/analytics'}
              className="h-20 flex flex-col gap-2"
            >
              <Activity className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
