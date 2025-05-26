
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProviderMetricsWidget } from '../widgets/ProviderMetricsWidget';
import { GraduationCap, Users, Calendar, Award, ClipboardList } from 'lucide-react';
import { useProviderDashboardData } from '@/hooks/dashboard/useProviderDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface ProviderDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const ProviderDashboard = ({ config, profile }: ProviderDashboardProps) => {
  const { metrics, instructorStatus, isLoading } = useProviderDashboardData();

  if (isLoading) {
    return <InlineLoader message="Loading provider dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
        <GraduationCap className="h-4 w-4 text-blue-600 mr-2" />
        <AlertDescription className="text-blue-800 font-medium">
          You are logged in as an Authorized Provider
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeInstructors || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Certified instructors
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.upcomingCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Scheduled in next 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certifications Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.certificationsIssued || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 12 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Instructor Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.instructorApplications || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProviderMetricsWidget providerId={profile.id} />
        
        <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Instructor Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {instructorStatus.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No instructor data available
                </p>
              ) : (
                instructorStatus.map((status) => (
                  <div key={status.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-blue-800 font-medium">{status.type}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                      {status.count}
                    </span>
                  </div>
                ))
              )}
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
              <Calendar className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-800">Schedule Course</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800">Manage Instructors</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Award className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-800">Issue Certificate</span>
            </button>
            <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <ClipboardList className="h-6 w-6 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-800">View Reports</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDashboard;
