
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';

export interface DashboardWidgetConfig {
  type: string;
  title: string;
  enabled: boolean;
}

export interface DashboardConfig {
  welcomeMessage: string;
  subtitle: string;
  widgets: DashboardWidgetConfig[];
}

export default function DashboardContent() {
  const { user } = useAuth();

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

  // Default configuration for all dashboards
  const defaultConfig: DashboardConfig = {
    welcomeMessage: `Welcome back, ${profile.display_name}!`,
    subtitle: "Here's what's happening with your training management system.",
    widgets: [
      { type: 'stats', title: 'Statistics', enabled: true },
      { type: 'recent-activity', title: 'Recent Activity', enabled: true },
      { type: 'quick-actions', title: 'Quick Actions', enabled: true }
    ]
  };

  // Render appropriate dashboard based on user role
  switch (profile.role) {
    case 'SA':
    case 'AD':
      return <AdminDashboard />;
    
    case 'IC':
    case 'IP':
    case 'IT':
      return <InstructorDashboard config={defaultConfig} profile={profile} />;
    
    case 'ST':
    default:
      return <StudentDashboard config={defaultConfig} profile={profile} />;
  }
}
