import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { PublicLayout } from './PublicLayout';
import { Loader2 } from 'lucide-react';
import { ALWAYS_PUBLIC_PAGES, MIXED_ACCESS_PAGES } from '@/config/routes';

export function LayoutRouter({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your session</p>
        </div>
      </div>
    );
  }
  
  // Determine which layout to use
  const isAlwaysPublicPage = ALWAYS_PUBLIC_PAGES.includes(location.pathname);
  const isMixedAccessPage = MIXED_ACCESS_PAGES.includes(location.pathname);
  
  // Debug logging to help identify layout selection issues
  console.log('LayoutRouter Debug:', {
    pathname: location.pathname,
    user: !!user,
    isAlwaysPublicPage,
    isMixedAccessPage,
    willUsePublicLayout: isAlwaysPublicPage || (isMixedAccessPage && !user)
  });
  
  // Use PublicLayout for always public pages or mixed access pages when not authenticated
  if (isAlwaysPublicPage || (isMixedAccessPage && !user)) {
    console.log('Using PublicLayout for:', location.pathname);
    return <PublicLayout>{children}</PublicLayout>;
  }
  
  // Use DashboardLayout for authenticated users or mixed access pages when authenticated
  console.log('Using DashboardLayout for:', location.pathname);
  return <DashboardLayout>{children}</DashboardLayout>;
}