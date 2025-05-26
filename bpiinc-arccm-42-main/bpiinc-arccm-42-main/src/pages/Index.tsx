import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Index = () => {
  const { user, loading: authLoading } = useAuth();

  // Only redirect if we're sure there's no user AND auth is not still loading
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your account...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
};

export default Index;