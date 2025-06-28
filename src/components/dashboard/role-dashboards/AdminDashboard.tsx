
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RealTimeDashboardWidget } from '../RealTimeDashboardWidget';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminDashboardProps {
  config: any;
  profile: any;
}

export default function AdminDashboard({ config, profile }: AdminDashboardProps) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => DashboardDataService.getSystemAdminMetrics(), // Admin gets similar view to SA but filtered
    refetchInterval: 30000
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: () => DashboardDataService.getRecentActivities(profile.id, 'AD'),
    refetchInterval: 60000
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          title="Pending Approvals"
          icon={AlertTriangle}
          value={metrics?.pendingApprovals}
          status={metrics?.pendingApprovals > 5 ? "warning" : "success"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
          actions={[
            { label: 'Review', onClick: () => window.location.href = '/certificate-requests' }
          ]}
        />

        <RealTimeDashboardWidget
          title="System Status"
          icon={CheckCircle}
          value={metrics?.systemHealth?.critical === 0 ? "Healthy" : "Issues"}
          status={metrics?.systemHealth?.critical === 0 ? "success" : "error"}
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />
      </div>

      {/* Management Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeDashboardWidget
          title="User Management"
          icon={Users}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <span className="font-medium">{metrics?.activeUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Users</span>
              <span className="font-medium">{metrics?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">New This Month</span>
              <span className="font-medium text-green-600">+12</span>
            </div>
          </div>
        </RealTimeDashboardWidget>

        <RealTimeDashboardWidget
          title="Recent Activities"
          icon={FileText}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
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
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/users'}
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/certificate-requests'}
              className="h-20 flex flex-col gap-2"
            >
              <Award className="h-6 w-6" />
              <span className="text-sm">Approvals</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/settings'}
              className="h-20 flex flex-col gap-2"
            >
              <Settings className="h-6 w-6" />
              <span className="text-sm">Settings</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/analytics'}
              className="h-20 flex flex-col gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
