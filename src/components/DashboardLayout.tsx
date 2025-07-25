
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut, Menu, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { Skeleton } from "./ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { CertificateNotificationBell } from "./notifications/UnifiedNotificationBell";
import { Separator } from "./ui/separator";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageTransition } from "./ui/page-transition";
import { MobileUserMenu } from "./ui/mobile-user-menu";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  // Handle page transitions
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => setIsPageTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <main className="flex-1 overflow-x-hidden">
      <header className="border-b bg-white shadow-sm sticky top-0 z-30 animate-fade-in">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <SidebarTrigger>
              <Menu className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
            </SidebarTrigger>
            <div className="flex items-center">
              <Building2 className="h-9 w-9 text-primary" />
              {!isMobile && (
                <>
                  <Separator orientation="vertical" className="mx-4 h-8" />
                  <div className="flex flex-col">
                    <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                      Enterprise Training Management
                    </h1>
                    <span className="text-xs text-blue-600 font-medium">
                      Dashboard
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <CertificateNotificationBell />
              <MobileUserMenu
                user={user}
                profile={profile}
                signOut={signOut}
              />
              <div className="hidden md:flex items-center gap-4">
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-blue-50 border border-blue-100">
                    <UserCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-800 truncate max-w-[160px]">
                      {profile?.display_name || user.email}
                    </span>
                    {isProfileLoading ? (
                      <Skeleton className="h-4 w-20" />
                    ) : profile?.role ? (
                      <span className="text-xs text-blue-600 font-semibold">
                        {ROLE_LABELS[profile.role]}
                      </span>
                    ) : (
                      <span className="text-xs text-red-500">
                        No role assigned
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-gray-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="container mx-auto p-4 sm:p-6">
        <PageTransition isTransitioning={isPageTransitioning}>
          {children}
        </PageTransition>
      </div>
    </main>
  );
}
