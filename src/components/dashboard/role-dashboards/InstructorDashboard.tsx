
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
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
  
  // Determine next role for progression path
  const getNextRole = () => {
    if (role === 'IT') return 'IP';
    if (role === 'IP') return 'IC';
    return null;
  };
  
  const nextRole = getNextRole();
  
  // Mock progression data - this would come from progression system
  const getProgressionPercentage = () => {
    if (role === 'IT') return 65;
    if (role === 'IP') return 40;
    return 100;
  };

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
            <p className="text-xs text-gray-500 mt-1">Scheduled in next 14 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students Taught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics?.studentsTaught || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Teaching Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.teachingHours || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Last 3 months</p>
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
                  You're on your way to becoming a {ROLE_LABELS[nextRole as any]}
                </p>
                <div className="mt-2">
                  <Progress value={getProgressionPercentage()} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {getProgressionPercentage()}% of requirements completed
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
