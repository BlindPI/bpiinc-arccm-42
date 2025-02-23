
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
                <div className="flex items-center">
                  <img 
                    src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" 
                    alt="Assured Response Logo" 
                    className={`${isMobile ? 'h-6' : 'h-7'} w-auto`}
                  />
                  {!isMobile && (
                    <div className="hidden md:flex items-center border-l border-gray-200 ml-4 pl-4">
                      <h1 className="text-[15px] font-semibold text-gray-700">
                        Certificate Management System
                      </h1>
                    </div>
                  )}
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-5 w-5 text-gray-500" />
                      <div className="flex flex-col">
                        <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
                          {user.email}
                        </span>
                        {isProfileLoading ? (
                          <Skeleton className="h-4 w-24" />
                        ) : profile?.role ? (
                          <span className="text-xs text-gray-500">
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
                      className="text-gray-700 hover:text-gray-900 border-gray-200"
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
