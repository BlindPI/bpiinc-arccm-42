
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTeamContext } from '@/hooks/useTeamContext';
import { SystemAdminDashboard } from './SystemAdminDashboard';
import { TeamLeaderDashboard } from './TeamLeaderDashboard';
import { InstructorDashboard } from './InstructorDashboard';
import { StudentDashboard } from './StudentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Users } from 'lucide-react';
import type { DatabaseUserRole } from '@/types/database-roles';

export function RoleBasedDashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { primaryTeam, isTeamRestricted } = useTeamContext();

  const userRole = profile?.role as DatabaseUserRole;

  if (profileLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Profile Setup Required
          </h3>
          <p className="text-yellow-700 text-center">
            Your account doesn't have a role assigned yet. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  // System Administrator Dashboard
  if (userRole === 'SA') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">System Administrator Dashboard</h1>
        </div>
        <SystemAdminDashboard />
      </div>
    );
  }

  // Administrator Dashboard (similar to SA but more limited)
  if (userRole === 'AD') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
        </div>
        <SystemAdminDashboard />
      </div>
    );
  }

  // Team Leader Dashboard
  if (userRole === 'TL' && primaryTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>
        </div>
        <TeamLeaderDashboard />
      </div>
    );
  }

  // Instructor Dashboards
  if (['IC', 'IP', 'IT'].includes(userRole)) {
    const instructorType = userRole === 'IC' ? 'Candidate' :
                          userRole === 'IP' ? 'Provisional' : 'Trainer';
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">Instructor {instructorType} Dashboard</h1>
        </div>
        <InstructorDashboard />
      </div>
    );
  }

  // Student Dashboard
  if (userRole === 'ST') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
        </div>
        <StudentDashboard />
      </div>
    );
  }

  // Fallback for other roles
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <Users className="h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Role-Specific Dashboard
        </h3>
        <p className="text-blue-700 text-center">
          Dashboard for role: {userRole}
        </p>
        <p className="text-sm text-blue-600 mt-2">
          Team-restricted access: {isTeamRestricted ? 'Yes' : 'No'}
        </p>
        {primaryTeam && (
          <p className="text-sm text-blue-600">
            Primary team: {primaryTeam.teams?.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
