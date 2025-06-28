
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRoleBasedDashboardData } from '@/hooks/useRoleBasedDashboardData';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Activity, 
  Calendar,
  Settings,
  Bell
} from 'lucide-react';

// Import dashboard components as default exports
import SystemAdminDashboard from './role-dashboards/SystemAdminDashboard';
import AdminDashboard from './role-dashboards/AdminDashboard';
import ProviderDashboard from './role-dashboards/ProviderDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import { LoadingDashboard } from './role-dashboards/LoadingDashboard';

export function FixedRoleBasedDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { 
    metrics, 
    recentActivities, 
    isLoading: dataLoading, 
    error,
    canViewSystemMetrics,
    canViewTeamMetrics,
    teamContext 
  } = useRoleBasedDashboardData();
  const { config } = useDashboardConfig();

  const userRole = profile?.role || user?.profile?.role;

  if (profileLoading || dataLoading) {
    return <LoadingDashboard message="Loading your personalized dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">Profile Setup Required</h3>
          <p className="text-yellow-700 mt-2">
            Your account doesn't have a role assigned yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard configuration with all required properties
  const dashboardConfig = {
    layout: 'grid' as const,
    theme: 'light' as const,
    showQuickActions: true,
    refreshInterval: 300000,
    compactMode: false,
    showNotifications: true,
    defaultView: 'overview',
    customSections: [],
    filterPresets: {},
    chartPreferences: {
      type: 'bar' as const,
      colors: ['#3b82f6', '#10b981', '#f59e0b'],
      showLegend: true
    },
    welcomeMessage: config?.welcomeMessage || 'Welcome to Your Dashboard',
    subtitle: config?.subtitle || 'Real-time insights and management tools',
    widgets: config?.widgets || []
  };

  // Common profile object for all dashboards
  const dashboardProfile = {
    id: user?.id || '',
    role: userRole,
    email: user?.email,
    name: profile?.display_name || user?.email?.split('@')[0] || 'User',
    status: profile?.status || 'ACTIVE',
    ...profile
  };

  // Route to appropriate dashboard based on role - pass required props
  const renderRoleDashboard = () => {
    switch (userRole) {
      case 'SA':
        return (
          <SystemAdminDashboard 
            config={dashboardConfig}
            profile={dashboardProfile}
          />
        );
      case 'AD':
        return (
          <AdminDashboard 
            config={dashboardConfig}
            profile={dashboardProfile}
          />
        );
      case 'AP':
        return (
          <ProviderDashboard 
            teamContext={teamContext}
            config={dashboardConfig}
            profile={dashboardProfile}
          />
        );
      case 'IC':
      case 'IP':
      case 'IT':
      case 'IN':
        return (
          <InstructorDashboard 
            teamContext={teamContext}
            config={dashboardConfig}
            profile={dashboardProfile}
          />
        );
      case 'ST':
        return (
          <StudentDashboard 
            config={dashboardConfig}
            profile={dashboardProfile}
          />
        );
      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Your Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your role ({userRole}) dashboard is being configured. Please contact support if this persists.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" data-dashboard-config={JSON.stringify(dashboardConfig)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dashboardConfig.welcomeMessage}
          </h1>
          <p className="text-muted-foreground">
            {dashboardConfig.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole}
          </Badge>
          {teamContext && (
            <Badge variant="secondary">
              {teamContext.teamName}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time Data
          </div>
        </div>
      </div>

      {renderRoleDashboard()}
    </div>
  );
}
