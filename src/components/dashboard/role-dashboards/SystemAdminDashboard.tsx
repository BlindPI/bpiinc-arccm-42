
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, BarChart3, Monitor } from 'lucide-react';
import { useSystemAdminDashboardData } from '@/hooks/dashboard/useSystemAdminDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';
import { ComplianceTierDashboard } from '@/components/compliance/ComplianceTierDashboard';

interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const SystemAdminDashboard = ({ config, profile }: SystemAdminDashboardProps) => {
  const { metrics, isLoading, error } = useSystemAdminDashboardData();
  
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="h-4 w-4 mr-1" />
            Compliance Management
          </TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <div className={`text-2xl font-bold ${metrics?.systemHealth.status === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
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
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Alert className="bg-gradient-to-r from-green-50 to-white border-green-200 shadow-sm">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800 font-medium">
              System-wide Compliance Management - Monitor and oversee organizational compliance
            </AlertDescription>
          </Alert>
          <ComplianceTierDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">User Management</h3>
                <p className="text-muted-foreground">
                  Advanced user management features will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">System Configuration</h3>
                <p className="text-muted-foreground">
                  System-wide configuration and settings management.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemAdminDashboard;
