
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { Skeleton } from "./ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "./notifications/NotificationBell";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="border-b bg-white/95 shadow-sm sticky top-0 z-30 animate-fade-in">
            <div className="container mx-auto px-4 flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-gray-600 hover:text-blue-700" />
                <div className="flex items-center">
                  <img 
                    src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" 
                    alt="Assured Response Logo" 
                    className="h-9 w-auto object-contain rounded bg-white/70 shadow"
                    style={{ minWidth: '110px' }}
                  />
                  {!isMobile && (
                    <div className="hidden lg:flex items-center border-l border-gray-200 ml-4 pl-4">
                      <h1 className="text-lg font-semibold text-gray-700 tracking-tight">
                        Certificate Management System
                      </h1>
                    </div>
                  )}
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-4 min-w-[180px]">
                  <NotificationBell />
                  <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-3">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-5 w-5 text-gray-500" />
                      <div className="flex flex-col">
                        <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
                          {user.email}
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
                      className="text-blue-700 hover:text-blue-800 border-gray-200"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={`container mx-auto ${isMobile ? 'px-3 py-3' : 'p-4'}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
