
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './role-dashboards/AdminDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import type { Profile } from '@/types/database';

interface DashboardContentProps {
  profile: Profile;
}

export default function DashboardContent({ profile }: DashboardContentProps) {
  const { user } = useAuth();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (profile.role) {
    case 'SA':
    case 'AD':
      return <AdminDashboard />;
    
    case 'IC':
    case 'IP':
    case 'IT':
      return <InstructorDashboard profile={profile} />;
    
    case 'ST':
    default:
      return <StudentDashboard profile={profile} />;
  }
}
