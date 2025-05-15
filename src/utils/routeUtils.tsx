
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUserWithProfile } from '@/types/auth';

export const DEBUG_ROUTES = false;

type ProtectedRouteProps = {
  user: AuthUserWithProfile | null;
  loading: boolean;
  authReady: boolean;
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * A utility component that protects routes from unauthenticated access
 */
export const ProtectedRoute = ({ 
  user, 
  loading, 
  authReady,
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) => {
  if (DEBUG_ROUTES) {
    console.log("[Route Protection] Status:", { user: !!user, loading, authReady });
  }

  // Still loading auth state
  if (loading || !authReady) {
    if (DEBUG_ROUTES) console.log("[Route Protection] Still loading auth state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auth ready but no user
  if (authReady && !user) {
    if (DEBUG_ROUTES) console.log("[Route Protection] Auth ready but no user, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Auth ready and user exists
  if (DEBUG_ROUTES) console.log("[Route Protection] Auth ready and user exists, rendering protected content");
  return <>{children}</>;
};
