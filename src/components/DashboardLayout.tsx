
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
          <div className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Certificate Management System
                </h1>
              </div>
              {user && (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-gray-500" />
                    <div className="flex flex-col">
                      <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
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

