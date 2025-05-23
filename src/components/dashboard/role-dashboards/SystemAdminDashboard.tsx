import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const SystemAdminDashboard = ({ config, profile }: SystemAdminDashboardProps) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <Shield className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-800 font-medium">
          You are logged in as a System Administrator
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">247</div>
            <p className="text-xs text-gray-500 mt-1">
              Active users in the system
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">42</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently active courses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-gray-500 mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">New user registered</span>
                <span className="text-gray-900 text-sm">5 minutes ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Course updated</span>
                <span className="text-gray-900 text-sm">1 hour ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Role transition approved</span>
                <span className="text-gray-900 text-sm">3 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-800 font-medium">Role transition request</span>
                <button className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200">
                  Review
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-800 font-medium">New course approval</span>
                <button className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200">
                  Review
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-800 font-medium">User verification</span>
                <button className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200">
                  Verify
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Shield className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-800">User Management</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Shield className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800">Course Management</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Shield className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-800">System Settings</span>
            </button>
            <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Shield className="h-6 w-6 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-800">Reports</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAdminDashboard;