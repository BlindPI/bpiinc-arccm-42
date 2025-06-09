
import React from 'react';
import { UserProfile, DashboardConfig } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Calendar, Award, Clock, ArrowUpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ROLE_LABELS } from '@/lib/roles';
import { useInstructorDashboardData } from '@/hooks/dashboard/useInstructorDashboardData';
import { DashboardActionButton } from '../ui/DashboardActionButton';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface InstructorDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const InstructorDashboard = ({ config, profile }: InstructorDashboardProps) => {
  const role = profile.role || 'IT';
  const { metrics, isLoading } = useInstructorDashboardData(profile.id);
  
  // Real progression calculation based on actual metrics
  const getProgressionPercentage = () => {
    if (!metrics) return 0;
    
    // Calculate progression based on real metrics
    const teachingHoursWeight = Math.min((metrics.teachingHours / 100) * 30, 30); // Max 30 points for 100+ hours
    const certificationsWeight = Math.min((metrics.certificationsIssued / 20) * 25, 25); // Max 25 points for 20+ certs
    const studentsWeight = Math.min((metrics.studentsTaught / 50) * 25, 25); // Max 25 points for 50+ students
    const experienceWeight = 20; // Base experience points
    
    return Math.round(teachingHoursWeight + certificationsWeight + studentsWeight + experienceWeight);
  };
  
  // Determine next role based on current role and progression
  const getNextRole = () => {
    if (role === 'IC') return 'IP'; // Candidate to Provisional
    if (role === 'IP') return 'IT'; // Provisional to Trainer
    return null; // Trainer is highest level
  };
  
  const nextRole = getNextRole();
  const progressionPercentage = getProgressionPercentage();

  if (isLoading) {
    return <InlineLoader message="Loading instructor dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-gradient-to-r from-teal-50 to-white border-teal-200 shadow-sm">
        <GraduationCap className="h-4 w-4 text-teal-600 mr-2" />
        <AlertDescription className="text-teal-800 font-medium">
          You are logged in as {ROLE_LABELS[role as any]}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.upcomingClasses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students Taught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.studentsTaught || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Unique students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certifications Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.certificationsIssued || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total certificates</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Teaching Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.teachingHours || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total hours taught</p>
          </CardContent>
        </Card>
      </div>

      {nextRole && (
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Progression Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <ArrowUpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Progress to {ROLE_LABELS[nextRole as any]}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Based on your teaching performance and metrics
                </p>
                <div className="mt-2">
                  <Progress value={progressionPercentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {progressionPercentage}% progression score
                  </p>
                </div>
              </div>
              <DashboardActionButton
                icon={ArrowUpCircle}
                label="View Path"
                path="/role-management"
                colorScheme="blue"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Instructor Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardActionButton
              icon={Calendar}
              label="View Schedule"
              description="View your teaching schedule"
              path="/courses"
              colorScheme="teal"
            />
            <DashboardActionButton
              icon={Award}
              label="Issue Certificate"
              description="Issue certificates to students"
              path="/certificates"
              colorScheme="blue"
            />
            <DashboardActionButton
              icon={Clock}
              label="Log Hours"
              description="Log your teaching hours"
              path="/teaching-sessions"
              colorScheme="purple"
            />
            <DashboardActionButton
              icon={GraduationCap}
              label="Training Resources"
              description="Access training materials"
              path="/courses"
              colorScheme="amber"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorDashboard;
