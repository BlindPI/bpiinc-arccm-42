
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PublicRoutes } from '@/components/routing/PublicRoutes';
import { ProtectedRoutes } from '@/components/routing/ProtectedRoutes';
import { LoadingDashboard } from '@/components/dashboard/LoadingDashboard';

export default function AppRoutes() {
  const { user, loading, authReady } = useAuth();

  // Show loading while auth is initializing
  if (loading || !authReady) {
    return <LoadingDashboard message="Loading..." />;
  }

  // Render appropriate routes based on authentication state
  if (user) {
    return <ProtectedRoutes />;
  } else {
    return <PublicRoutes />;
  }
}
