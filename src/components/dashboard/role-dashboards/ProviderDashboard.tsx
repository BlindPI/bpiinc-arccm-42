
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Calendar, Users, Award, ClipboardList } from 'lucide-react';
import { useProviderDashboardData } from '@/hooks/dashboard/useProviderDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface ProviderDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const ProviderDashboard = ({ config, profile }: ProviderDashboardProps) => {
  const { metrics, isLoading } = useProviderDashboardData();

  if (isLoading) {
    return <InlineLoader message="Loading provider dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <GraduationCap className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-800 font-medium">
          You are logged in as an Authorized Provider
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeInstructors || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Certified instructors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.upcomingCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduled in next 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certifications Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.certificationsIssued || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Instructor Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.instructorApplications || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Provider Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={Calendar}
              label="Schedule Course"
              description="Schedule and manage courses"
              path="/courses"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Users}
              label="Manage Team"
              description="Manage instructors and team members"
              path="/teams"
              colorScheme="green"
            />
            <DashboardActionButton
              icon={Award}
              label="Issue Certificate"
              description="Issue new certificates"
              path="/certificates"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={ClipboardList}
              label="View Reports"
              description="View provider analytics and reports"
              path="/analytics"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDashboard;
