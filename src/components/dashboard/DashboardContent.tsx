import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROLE_LABELS } from '@/lib/roles';

// Regular imports instead of lazy loading to fix dynamic import issues
import SystemAdminDashboard from './role-dashboards/SystemAdminDashboard';
import AdminDashboard from './role-dashboards/AdminDashboard';
import ProviderDashboard from './role-dashboards/ProviderDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';

// Add these new imports
import { useTeamContext } from '@/hooks/useTeamContext';
import { TeamProviderDashboard } from './team/TeamProviderDashboard';
import { TeamInstructorDashboard } from './team/TeamInstructorDashboard';
import { TeamMemberDashboard } from './team/TeamMemberDashboard';

export const DashboardContent = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { config, isLoading: configLoading } = useDashboardConfig();
  const { shouldUseTeamDashboard, primaryTeam } = useTeamContext();

  if (profileLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <Alert className="bg-red-50 border-red-200 text-red-800">
        <AlertDescription>
          User profile not found. Please sign in again.
        </AlertDescription>
      </Alert>
    );
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderRoleDashboard = () => {
    const role = profile.role || 'IT';

    // If user should use team dashboard, render team-specific components
    if (shouldUseTeamDashboard && primaryTeam) {
      if (role === 'AP') {
        return <TeamProviderDashboard />;
      }
      if (['IC', 'IP', 'IT'].includes(role)) {
        return <TeamInstructorDashboard />;
      }
      if (role === 'IN') {
        return <TeamMemberDashboard />;
      }
    }

    // Fallback to role-based dashboards for admins or users without teams
    if (role === 'SA') {
      return <SystemAdminDashboard config={config} profile={profile} />;
    }
    if (role === 'AD') {
      return <AdminDashboard config={config} profile={profile} />;
    }
    if (role === 'AP') {
      return <ProviderDashboard config={config} profile={profile} />;
    }
    if (['IC', 'IP', 'IT'].includes(role)) {
      return <InstructorDashboard config={config} profile={profile} />;
    }
    if (role === 'IN') {
      return <StudentDashboard config={config} profile={profile} />;
    }

    // Default to student dashboard for any other roles
    return <StudentDashboard config={config} profile={profile} />;
  };

  // Update the greeting to include team context if applicable
  const getGreeting = () => {
    const timeGreeting = getTimeOfDay();
    const userName = profile.display_name || user.email?.split('@')[0];
    
    if (shouldUseTeamDashboard && primaryTeam?.teams?.name) {
      return `${timeGreeting}, ${userName} - ${primaryTeam.teams.name}`;
    }
    
    return `${timeGreeting}, ${userName}`;
  };

  // Update subtitle for team context
  const getSubtitle = () => {
    if (shouldUseTeamDashboard && primaryTeam?.teams?.name) {
      return `Team Dashboard - ${primaryTeam.teams.name}`;
    }
    return config.subtitle;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<UserCircle2 className="h-7 w-7 text-primary" />}
        title={getGreeting()}
        subtitle={getSubtitle()}
        badge={profile.role ? {
          text: shouldUseTeamDashboard 
            ? `Team Role: ${primaryTeam?.role || 'Member'} | ${ROLE_LABELS[profile.role]}`
            : `Role: ${ROLE_LABELS[profile.role]}`,
          variant: "secondary"
        } : undefined}
        className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50"
      />

      {renderRoleDashboard()}
    </div>
  );
};

export default DashboardContent;
