
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { UserManagementLoading } from './components/user-management/UserManagementLoading';
import { Loader2 } from 'lucide-react';

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
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route element={<AuthGuard />}>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={
            <Suspense fallback={<RouteLoader />}>
              <Profile />
            </Suspense>
          } />
          <Route path="/certifications" element={
            <Suspense fallback={<RouteLoader />}>
              <Certifications />
            </Suspense>
          } />
          <Route path="/courses" element={
            <Suspense fallback={<RouteLoader />}>
              <Courses />
            </Suspense>
          } />
          <Route path="/role-management" element={
            <Suspense fallback={<RouteLoader />}>
              <RoleManagement />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<RouteLoader />}>
              <Settings />
            </Suspense>
          } />
          <Route path="/teams" element={
            <Suspense fallback={<RouteLoader />}>
              <Teams />
            </Suspense>
          } />
          <Route path="/user-management" element={
            <Suspense fallback={<UserManagementLoading />}>
              <UserManagement />
            </Suspense>
          } />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
