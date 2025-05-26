
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardLayout } from './DashboardLayout';
import { PublicLayout } from './PublicLayout';
import { AppSidebar } from './AppSidebar';
import { PublicSidebar } from './PublicSidebar';
import { Loader2 } from 'lucide-react';
import { ALWAYS_PUBLIC_PAGES, MIXED_ACCESS_PAGES, PROTECTED_PAGES } from '@/config/routes';

export function LayoutRouter({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your session</p>
        </div>
      </div>
    );
  }
  
  // Determine which layout to use based on route and auth status
  const isAlwaysPublicPage = ALWAYS_PUBLIC_PAGES.includes(location.pathname);
  const isMixedAccessPage = MIXED_ACCESS_PAGES.includes(location.pathname);
  const isProtectedPage = PROTECTED_PAGES.includes(location.pathname);
  
  // Don't show sidebar on certain public pages for cleaner UX
  const hideSidebarPages = ["/landing", "/auth", "/auth/signin", "/auth/signup"];
  const shouldShowSidebar = !hideSidebarPages.includes(location.pathname);
  
  // Force public layout for always public pages (landing, auth, etc.) - no sidebar
  if (isAlwaysPublicPage) {
    return (
      <div className="animate-fade-in">
        <PublicLayout>{children}</PublicLayout>
      </div>
    );
  }
  
  // For mixed access pages and protected pages, show with sidebar
  if (isMixedAccessPage || isProtectedPage || shouldShowSidebar) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 animate-fade-in">
          {user ? <AppSidebar /> : <PublicSidebar />}
          {user ? <DashboardLayout>{children}</DashboardLayout> : <PublicLayout>{children}</PublicLayout>}
        </div>
      </SidebarProvider>
    );
  }
  
  // Default to public layout for any other pages
  return (
    <div className="animate-fade-in">
      <PublicLayout>{children}</PublicLayout>
    </div>
  );
}
