
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { EnterpriseDataService } from '@/services/enterprise/dataService';
import { MetricWidget } from '../widgets/MetricWidget';
import { DataTableWidget } from '../widgets/DataTableWidget';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function EnterpriseDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const userRole = profile?.role || user?.profile?.role;

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['enterprise-dashboard-metrics', userRole],
    queryFn: () => EnterpriseDataService.getDashboardMetrics(userRole || ''),
    enabled: !!userRole,
    refetchInterval: 30000
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['enterprise-recent-activities'],
    queryFn: () => EnterpriseDataService.getRecentActivities(),
    refetchInterval: 60000
  });

  if (profileLoading || metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading Enterprise Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-yellow-600" />
            <h3 className="text-xl font-semibold text-yellow-800">Profile Setup Required</h3>
          </div>
          <p className="text-yellow-700 mb-4">
            Your account doesn't have a role assigned yet. Please contact your system administrator 
            to complete your profile setup.
          </p>
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            Pending Setup
          </Badge>
        </div>
      </div>
    );
  }

  const activityColumns = [
    { 
      key: 'action', 
      title: 'Action',
      render: (value: string) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    { key: 'entity_type', title: 'Type' },
    { 
      key: 'created_at', 
      title: 'Time',
      render: (value: string) => (
        <span className="text-gray-600 text-sm">
          {new Date(value).toLocaleString()}
        </span>
      )
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add and manage user accounts',
      icon: Users,
      href: '/users',
      roles: ['SA', 'AD']
    },
    {
      title: 'Certificates',
      description: 'Review and approve certificates',
      icon: Award,
      href: '/certificates',
      roles: ['SA', 'AD', 'AP']
    },
    {
      title: 'Team Management',
      description: 'Organize and manage teams',
      icon: Activity,
      href: '/teams',
      roles: ['SA', 'AD', 'AP']
    },
    {
      title: 'CRM Dashboard',
      description: 'Track leads and opportunities',
      icon: TrendingUp,
      href: '/crm',
      roles: ['SA', 'AD', 'AP']
    }
  ].filter(action => action.roles.includes(userRole));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Enterprise Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Welcome back! Here's your system overview.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200 mb-1">Role</div>
            <Badge variant="secondary" className="text-blue-800">
              {userRole}
            </Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={Users}
          status="healthy"
          trend={{ value: 12, isPositive: true }}
          onClick={() => window.location.href = '/users'}
        />
        
        <MetricWidget
          title="Active Certificates"
          value={metrics?.activeCertifications || 0}
          icon={Award}
          status="healthy"
          trend={{ value: 8, isPositive: true }}
          onClick={() => window.location.href = '/certificates'}
        />
        
        <MetricWidget
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          icon={AlertTriangle}
          status={metrics?.pendingApprovals ? (metrics.pendingApprovals > 10 ? 'warning' : 'healthy') : 'healthy'}
        />
        
        <MetricWidget
          title="System Health"
          value="Operational"
          icon={CheckCircle}
          status="healthy"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <DataTableWidget
            title="Recent System Activity"
            data={activities.slice(0, 8)}
            columns={activityColumns}
            maxHeight="500px"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={() => window.location.href = action.href}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {action.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <Badge className="bg-green-100 text-green-800 text-xs">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Background Jobs</span>
                <Badge className="bg-green-100 text-green-800 text-xs">Running</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
