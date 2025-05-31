
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Settings, BarChart3, Monitor } from 'lucide-react';
import { useSystemAdminRealData } from '@/hooks/dashboard/useRealDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const SystemAdminDashboard = ({ config, profile }: SystemAdminDashboardProps) => {
  const { data: metrics, isLoading, error } = useSystemAdminRealData();
  
  if (isLoading) {
    return <InlineLoader message="Loading system dashboard..." />;
  }
  
  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200 shadow-sm">
        <AlertDescription className="text-red-800 font-medium">
          Error loading dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <Shield className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-800 font-medium">
          You are logged in as a System Administrator
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active users in the system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active courses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics?.systemHealth.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>
              {metrics?.systemHealth.status || 'UNKNOWN'}
            </div>
            <p className="text-xs text-gray-500 mt-1">{metrics?.systemHealth.message}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={Users}
              label="User Management"
              description="Manage system users and permissions"
              path="/user-management"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Settings}
              label="System Settings"
              description="Configure system-wide settings"
              path="/system-settings"
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
    </div>
  );
};

export default SystemAdminDashboard;
