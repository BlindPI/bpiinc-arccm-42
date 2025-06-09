
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRoleBasedDashboardData } from '@/hooks/useRoleBasedDashboardData';
import SystemAdminDashboard from './role-dashboards/SystemAdminDashboard';
import AdminDashboard from './role-dashboards/AdminDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RoleBasedDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { config } = useDashboardConfig();
  const {
    metrics,
    recentActivities,
    isLoading: dataLoading,
    error: dataError,
    canViewSystemMetrics,
    canViewTeamMetrics,
    teamContext
  } = useRoleBasedDashboardData();

  console.log('🔧 ROLE-BASED-DASHBOARD: Render state:', {
    user: !!user,
    profile: !!profile,
    userRole: profile?.role,
    profileLoading,
    dataLoading,
    profileError: profileError?.message,
    dataError,
    canViewSystemMetrics,
    canViewTeamMetrics,
    teamContext,
    metrics
  });

  // Handle loading states
  if (profileLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Loading Dashboard</h3>
          <p className="text-gray-500 mt-1">
            {profileLoading ? 'Loading profile...' : 'Loading dashboard data...'}
          </p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (profileError || dataError) {
    return (
      <Alert className="mx-6 my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dashboard Error:</strong> {profileError?.message || dataError}
          <br />
          <span className="text-sm text-muted-foreground mt-2 block">
            Please try refreshing the page or contact support if the issue persists.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // Get user role
  const userRole = profile?.role;

  if (!userRole) {
    return (
      <Card className="mx-6 my-4">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Role Assignment Required</h3>
          <p className="text-gray-600">
            Your account doesn't have a role assigned yet. Please contact your administrator to assign a role.
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log('🔧 ROLE-BASED-DASHBOARD: Rendering dashboard for role:', userRole);

  // Route to role-specific dashboard
  switch (userRole) {
    case 'SA':
      return <SystemAdminDashboard />;
    
    case 'AD':
      return <AdminDashboard />;
    
    case 'TL':
      return <TeamLeaderDashboard />;
    
    case 'IC':
    case 'IP':
    case 'IT':
    case 'IN':
      return <InstructorDashboard />;
    
    case 'ST':
      return <StudentDashboard />;
    
    default:
      return (
        <Card className="mx-6 my-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unknown Role</h3>
            <p className="text-gray-600">
              Role "{userRole}" is not recognized. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      );
  }
}
