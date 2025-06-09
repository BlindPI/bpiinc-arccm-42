
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Settings, BarChart3, Monitor, AlertTriangle, Loader2 } from 'lucide-react';
import { useSystemAdminDashboardData } from '@/hooks/dashboard/useSystemAdminDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const SystemAdminDashboard = ({ config, profile }: SystemAdminDashboardProps) => {
  const { metrics, recentActivity, pendingApprovals, isLoading, error } = useSystemAdminDashboardData();
  
  console.log('🔧 SYSTEM-ADMIN-DASHBOARD: Render state:', {
    metrics,
    recentActivity: recentActivity?.length || 0,
    pendingApprovals: pendingApprovals?.length || 0,
    isLoading,
    error,
    profile: profile?.role
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Loading System Dashboard</h3>
          <p className="text-gray-500 mt-1">Please wait while we load your administrative data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert className="m-6 bg-red-50 border-red-200 shadow-sm">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 font-medium">
          <strong>Dashboard Error:</strong> {error}
          <br />
          <span className="text-sm font-normal mt-2 block">
            Please try refreshing the page. If the issue persists, contact technical support.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Welcome Header */}
      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 font-medium">
          Welcome back, {profile.display_name}! You are logged in as a System Administrator.
        </AlertDescription>
      </Alert>

      {/* System Metrics Cards */}
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
            <p className="text-xs text-gray-500 mt-1">Registered in the system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
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
            <div className="text-2xl font-bold text-gray-900">{metrics?.pendingRequests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* System Administration Actions */}
      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={Users}
              label="User Management"
              description="Manage system users and permissions"
              path="/users"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Settings}
              label="System Settings"
              description="Configure system-wide settings"
              path="/settings"
              colorScheme="green"
            />
            <DashboardActionButton
              icon={BarChart3}
              label="Reports"
              description="View system analytics and reports"
              path="/analytics"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={Monitor}
              label="System Monitoring"
              description="Monitor system health and performance"
              path="/system-monitoring"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals && pendingApprovals.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 5).map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{approval.type}</p>
                      <p className="text-xs text-gray-500">
                        {approval.requesterName} • {new Date(approval.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No pending approvals</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
