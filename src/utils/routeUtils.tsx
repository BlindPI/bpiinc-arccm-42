
import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const redirectAttempted = useRef(false);
  
  // Track redirection attempts to prevent loops
  useEffect(() => {
    if (!user && authReady && !loading) {
      redirectAttempted.current = true;
      if (DEBUG_ROUTES) console.log("[Route Protection] Setting redirect attempted");
    }
  }, [user, authReady, loading]);
  
  if (DEBUG_ROUTES) {
    console.log("[Route Protection] Status:", { 
      path: location.pathname,
      user: !!user, 
      loading, 
      authReady, 
      redirectAttempted: redirectAttempted.current 
    });
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

  // Auth ready but no user - redirect to login only if we haven't tried already to prevent loops
  if (authReady && !user && !redirectAttempted.current) {
    if (DEBUG_ROUTES) console.log("[Route Protection] Auth ready but no user, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Auth ready and user exists, or we've already attempted a redirect
  if (DEBUG_ROUTES) console.log("[Route Protection] Rendering protected content");
  return <>{children}</>;
};
