
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { CoreDataService } from '@/services/core/dataService';
import { MetricCard } from '@/components/core/MetricCard';
import { DataTable } from '@/components/core/DataTable';
import { LoadingDashboard } from './role-dashboards/LoadingDashboard';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  FileText
} from 'lucide-react';

export function FixedRoleBasedDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const userRole = profile?.role || user?.profile?.role;

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', userRole],
    queryFn: () => CoreDataService.getDashboardMetrics(userRole || ''),
    enabled: !!userRole,
    refetchInterval: 30000
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => CoreDataService.getRecentActivities(),
    refetchInterval: 60000
  });

  if (profileLoading || metricsLoading) {
    return <LoadingDashboard />;
  }

  if (!userRole) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">Profile Setup Required</h3>
          <p className="text-yellow-700 mt-2">
            Your account doesn't have a role assigned yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const activityColumns = [
    { key: 'action', title: 'Action' },
    { key: 'entity_type', title: 'Type' },
    { 
      key: 'created_at', 
      title: 'Time',
      render: (value: string) => new Date(value).toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={Users}
          onClick={() => window.location.href = '/users'}
        />
        
        <MetricCard
          title="Active Certificates"
          value={metrics?.activeCertifications || 0}
          icon={Award}
          onClick={() => window.location.href = '/certificates'}
        />
        
        <MetricCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          icon={AlertTriangle}
        />
        
        <MetricCard
          title="System Status"
          value="Healthy"
          icon={CheckCircle}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Recent Activity"
          data={activities.slice(0, 5)}
          columns={activityColumns}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {userRole === 'SA' || userRole === 'AD' ? (
              <>
                <button
                  onClick={() => window.location.href = '/users'}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Users className="h-6 w-6 mb-2" />
                  <div className="font-medium">Manage Users</div>
                  <div className="text-sm text-muted-foreground">Add and manage user accounts</div>
                </button>
                
                <button
                  onClick={() => window.location.href = '/certificates'}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Award className="h-6 w-6 mb-2" />
                  <div className="font-medium">Certificates</div>
                  <div className="text-sm text-muted-foreground">Review and approve certificates</div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => window.location.href = '/certificates'}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Award className="h-6 w-6 mb-2" />
                  <div className="font-medium">My Certificates</div>
                  <div className="text-sm text-muted-foreground">View your certificates</div>
                </button>
                
                <button
                  onClick={() => console.log('Profile settings')}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Activity className="h-6 w-6 mb-2" />
                  <div className="font-medium">Profile</div>
                  <div className="text-sm text-muted-foreground">Update your information</div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
