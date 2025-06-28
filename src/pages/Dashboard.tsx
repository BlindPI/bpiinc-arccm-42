
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  const { user, loading: authLoading, authReady } = useAuth();

  // Show loading state if auth is still initializing or not ready
  if (authLoading || !authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your dashboard...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your workspace</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated and auth is ready
  if (!user && authReady && !authLoading) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <DashboardContent />;
};

export default Dashboard;
