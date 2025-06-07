
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';

export default function DashboardContent() {
  const { user } = useAuth();
  const { config } = useDashboardConfig();

  if (!user || !user.profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const profile = user.profile;

  // Render appropriate dashboard based on user role
  switch (profile.role) {
    case 'SA':
    case 'AD':
      return <AdminDashboard />;
    
    case 'IC':
    case 'IP':
    case 'IT':
      return <InstructorDashboard config={config} profile={profile} />;
    
    case 'ST':
    default:
      return <StudentDashboard config={config} profile={profile} />;
  }
}
