
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROLE_LABELS } from '@/lib/roles';
import { Suspense, lazy } from 'react';
import { UserProfile } from '@/types/auth';

// Lazy load role-specific dashboards
const SystemAdminDashboard = lazy(() => import('./role-dashboards/SystemAdminDashboard'));
const AdminDashboard = lazy(() => import('./role-dashboards/AdminDashboard'));
const ProviderDashboard = lazy(() => import('./role-dashboards/ProviderDashboard'));
const InstructorDashboard = lazy(() => import('./role-dashboards/InstructorDashboard'));

export const DashboardContent = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { config, isLoading: configLoading } = useDashboardConfig();

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

  // Convert Profile to UserProfile type for compatibility
  const userProfile: UserProfile = {
    id: profile.id,
    role: profile.role as UserProfile['role'],
    display_name: profile.display_name,
    email: profile.email,
    phone: profile.phone,
    organization: profile.organization,
    job_title: profile.job_title,
    status: profile.status as UserProfile['status'],
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };

  const renderRoleDashboard = () => {
    const role = userProfile.role || 'IT';

    return (
      <Suspense fallback={<div className="animate-pulse p-8 text-center">Loading dashboard...</div>}>
        {role === 'SA' && <SystemAdminDashboard config={config} profile={userProfile} />}
        {role === 'AD' && <AdminDashboard config={config} profile={userProfile} />}
        {role === 'AP' && <ProviderDashboard config={config} profile={userProfile} />}
        {['IC', 'IP', 'IT', 'IN'].includes(role) && <InstructorDashboard config={config} profile={userProfile} />}
      </Suspense>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<UserCircle2 className="h-7 w-7 text-primary" />}
        title={`${getTimeOfDay()}, ${userProfile.display_name || user.email?.split('@')[0]}`}
        subtitle={config.subtitle}
        badge={userProfile.role ? {
          text: `Role: ${ROLE_LABELS[userProfile.role]}`,
          variant: "secondary"
        } : undefined}
        className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50"
      />

      {renderRoleDashboard()}
    </div>
  );
};

export default DashboardContent;
