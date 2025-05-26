
import React from 'react';
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentEnrollmentsWidget } from '../widgets/StudentEnrollmentsWidget';
import { CertificatesWidget } from '../widgets/CertificatesWidget';
import { BookOpen, Award, Calendar, Target } from 'lucide-react';
import { useStudentDashboardData } from '@/hooks/dashboard/useStudentDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface StudentDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const StudentDashboard = ({ config, profile }: StudentDashboardProps) => {
  const { metrics, isLoading } = useStudentDashboardData(profile.id);

  if (isLoading) {
    return <InlineLoader message="Loading student dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-green-50 to-white border-green-200 shadow-sm">
        <BookOpen className="h-4 w-4 text-green-600 mr-2" />
        <AlertDescription className="text-green-800 font-medium">
          Welcome to your learning dashboard
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.completedCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.certificates || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Earned certificates
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Study Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics?.studyHours || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total recorded
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StudentEnrollmentsWidget studentId={profile.id} />
        <CertificatesWidget userId={profile.id} />
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <BookOpen className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-800">Browse Courses</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Calendar className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800">View Schedule</span>
            </button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Award className="h-6 w-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-800">My Certificates</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Target className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-800">Learning Goals</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
