import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { UserManagementLoading } from './components/user-management/UserManagementLoading';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useSystemSettings } from './hooks/useSystemSettings';

// Lazy load components
const Auth = lazy(() => import('./pages/Auth'));
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const Certifications = lazy(() => import('./pages/Certifications'));
const Courses = lazy(() => import('./pages/Courses'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const Teams = lazy(() => import('./pages/Teams'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for routes
const RouteLoader = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// AuthGuard component for protected routes
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { prefetchSystemSettings } = useSystemSettings();
  
  useEffect(() => {
    if (user) {
      // Prefetch system settings when user is authenticated
      prefetchSystemSettings();
    }
  }, [user, prefetchSystemSettings]);
  
  if (loading) {
    return <RouteLoader />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/certifications" element={<AuthGuard><Certifications /></AuthGuard>} />
        <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
        <Route path="/role-management" element={<AuthGuard><RoleManagement /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/teams" element={<AuthGuard><Teams /></AuthGuard>} />
        <Route 
          path="/user-management" 
          element={
            <AuthGuard>
              <Suspense fallback={<UserManagementLoading />}>
                <UserManagement />
              </Suspense>
            </AuthGuard>
          } 
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
