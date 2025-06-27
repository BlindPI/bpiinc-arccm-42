
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { FixedRoleBasedDashboard } from './FixedRoleBasedDashboard';
import { LoadingDashboard } from './LoadingDashboard';
import { SimpleRoleRouter } from './SimpleRoleRouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  console.log('🏢 ENTERPRISE-DASHBOARD: Render state:', {
    user: !!user,
    userProfile: !!user?.profile,
    profile: !!profile,
    authLoading,
    profileLoading,
    userRole: profile?.role || user?.profile?.role || 'unknown'
  });

  // Show loading while auth is still initializing
  if (authLoading) {
    console.log('🏢 ENTERPRISE-DASHBOARD: Auth still loading');
    return <LoadingDashboard message="Loading enterprise dashboard..." />;
  }

  // If no user, this should be handled by route protection
  if (!user) {
    console.log('🏢 ENTERPRISE-DASHBOARD: No user found');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No user session found</p>
        </div>
      </div>
    );
  }

  // Get user role from either profile or user.profile
  const userRole = profile?.role || user?.profile?.role;
  
  // If we don't have a role yet and profile is still loading, show loading
  if (!userRole && profileLoading) {
    console.log('🏢 ENTERPRISE-DASHBOARD: Profile still loading');
    return <LoadingDashboard message="Loading profile and compliance data..." />;
  }

  // If we still don't have a role, show fallback with basic router
  if (!userRole) {
    console.log('🏢 ENTERPRISE-DASHBOARD: No role found, showing fallback');
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Profile Setup Required:</strong> Your account doesn't have a role assigned yet.
            Please contact your administrator to access the enterprise compliance dashboard.
          </AlertDescription>
        </Alert>
        <SimpleRoleRouter />
      </div>
    );
  }

  console.log('🏢 ENTERPRISE-DASHBOARD: Rendering enterprise compliance dashboard for role:', userRole);

  // Show success banner for enterprise system activation
  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ <strong>Enterprise Dashboard Active:</strong> Now using the full 98-component compliance system with
          dual-tier management, real-time updates, and advanced UI/UX for {userRole} users.
        </AlertDescription>
      </Alert>
      
      {/* Render the Enterprise Dashboard System */}
      <FixedRoleBasedDashboard />
    </div>
  );
}
