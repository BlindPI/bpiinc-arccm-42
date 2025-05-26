
import { UserProfile } from '@/types/auth';
import { DashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstructorSessionsWidget } from '../widgets/InstructorSessionsWidget';
import { ComplianceStatusWidget } from '../widgets/ComplianceStatusWidget';
import { GraduationCap, Calendar, Award, Clock, ArrowUpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ROLE_LABELS } from '@/lib/roles';

interface InstructorDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

const InstructorDashboard = ({ config, profile }: InstructorDashboardProps) => {
  const role = profile.role || 'IT';
  
  // Determine next role for progression path
  const getNextRole = () => {
    if (role === 'IT') return 'IP';
    if (role === 'IP') return 'IC';
    return null;
  };
  
  const nextRole = getNextRole();
  
  // Mock progression data
  const getProgressionPercentage = () => {
    if (role === 'IT') return 65;
    if (role === 'IP') return 40;
    return 100;
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-teal-50 to-white border-teal-200 shadow-sm">
        <GraduationCap className="h-4 w-4 text-teal-600 mr-2" />
        <AlertDescription className="text-teal-800 font-medium">
          You are logged in as {ROLE_LABELS[role as any]}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-gray-500 mt-1">
              Scheduled in next 14 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students Taught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">127</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 12 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certifications Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">98</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 12 months
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Teaching Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">42</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 3 months
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InstructorSessionsWidget instructorId={profile.id} />
        <ComplianceStatusWidget userId={profile.id} />
      </div>

      {nextRole && (
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-white shadow-md">
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
                View Path
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Calendar className="h-6 w-6 text-teal-600 mb-2" />
              <span className="text-sm font-medium text-teal-800">View Schedule</span>
            </button>
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Award className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-800">Issue Certificate</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <Clock className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-800">Log Hours</span>
            </button>
            <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg flex flex-col items-center justify-center transition-colors">
              <GraduationCap className="h-6 w-6 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-800">Training Resources</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorDashboard;
