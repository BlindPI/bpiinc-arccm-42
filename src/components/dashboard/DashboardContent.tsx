
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { SimpleRoleRouter } from './SimpleRoleRouter';
import { LoadingDashboard } from './LoadingDashboard';

export default function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  console.log('🔧 DASHBOARD-CONTENT: Render state:', {
    user: !!user,
    userProfile: !!user?.profile,
    profile: !!profile,
    authLoading,
    profileLoading,
    userRole: profile?.role || user?.profile?.role || 'unknown'
  });

  // Show loading while auth is still initializing
  if (authLoading) {
    console.log('🔧 DASHBOARD-CONTENT: Auth still loading');
    return <LoadingDashboard message="Loading authentication..." />;
  }

  // If no user, this should be handled by route protection
  if (!user) {
    console.log('🔧 DASHBOARD-CONTENT: No user found');
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
    console.log('🔧 DASHBOARD-CONTENT: Profile still loading');
    return <LoadingDashboard message="Loading profile..." />;
  }

  // If we still don't have a role, show a fallback dashboard
  if (!userRole) {
    console.log('🔧 DASHBOARD-CONTENT: No role found, showing fallback');
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">Profile Setup Required</h3>
          <p className="text-yellow-700 mt-2">
            Your account doesn't have a role assigned yet. Please contact your administrator.
          </p>
        </div>
        <SimpleRoleRouter />
      </div>
    );
  }

  console.log('🔧 DASHBOARD-CONTENT: Rendering role-based dashboard for role:', userRole);

  // Render the working role-based dashboard with proper data
  return <SimpleRoleRouter />;
}
