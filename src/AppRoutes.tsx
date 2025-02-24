
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { UserManagementLoading } from './components/user-management/UserManagementLoading';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Certifications from './pages/Certifications';
import { DashboardLayout } from './components/DashboardLayout';

// Lazy load components
const Profile = lazy(() => import('./pages/Profile'));
const Courses = lazy(() => import('./pages/Courses'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Teams = lazy(() => import('./components/team'));
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
  
  if (loading) {
    return <RouteLoader />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route 
          path="/auth" 
          element={
            user ? <Navigate to="/" replace /> : <Auth />
          } 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
        <Route path="/profile" element={
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <Profile />
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/certifications" element={
          <AuthGuard>
            <Certifications />
          </AuthGuard>
        } />
        <Route path="/courses" element={
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <Courses />
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/role-management" element={
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <RoleManagement />
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <Settings />
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/user-management" element={
          <AuthGuard>
            <Suspense fallback={<UserManagementLoading />}>
              <UserManagement />
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/teams" element={
          <AuthGuard>
            <DashboardLayout>
              <div className="container mx-auto p-6">
                <Teams />
              </div>
            </DashboardLayout>
          </AuthGuard>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
