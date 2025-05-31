
import React from 'react';
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Award, Calendar, Target } from 'lucide-react';
import { useStudentDashboardData } from '@/hooks/dashboard/useStudentDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
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
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-gradient-to-r from-green-50 to-white border-green-200 shadow-sm">
        <BookOpen className="h-4 w-4 text-green-600 mr-2" />
        <AlertDescription className="text-green-800 font-medium">
          Welcome to your learning dashboard
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.activeCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.completedCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.certificates || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Earned certificates</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Study Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics?.studyHours || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Student Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={BookOpen}
              label="Browse Courses"
              description="Find and enroll in courses"
              path="/courses/browse"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Calendar}
              label="View Schedule"
              description="View your course schedule"
              path="/student/schedule"
              colorScheme="green"
            />
            <DashboardActionButton
              icon={Award}
              label="My Certificates"
              description="View your certificates"
              path="/certificates"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={Target}
              label="Learning Goals"
              description="Set and track learning goals"
              path="/student/goals"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
