
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { Skeleton } from "./ui/skeleton";
import { useProfile } from "@/hooks/useProfile";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="border-b">
            <div className="container mx-auto p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Certificate Management System</h1>
              </div>
              {user && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.email}</span>
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
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
