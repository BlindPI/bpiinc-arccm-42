
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut, Menu, ChevronDown, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { ROLE_LABELS } from "@/lib/roles";
import { Skeleton } from "./ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBell } from "./notifications/NotificationBell";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <header className="border-b bg-white shadow-sm sticky top-0 z-30 animate-fade-in">
            <div className="container mx-auto px-4 flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger>
                  <Menu className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
                </SidebarTrigger>
                <div className="flex items-center">
                  <img 
                    src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" 
                    alt="Assured Response Logo" 
                    className="h-9 w-auto object-contain rounded bg-white shadow-sm"
                    style={{ minWidth: '110px' }}
                  />
                  {!isMobile && (
                    <>
                      <Separator orientation="vertical" className="mx-4 h-8" />
                      <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                        Certificate Management System
                      </h1>
                    </>
                  )}
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <div className="md:flex items-center gap-4">
                    <Separator orientation="vertical" className="hidden md:block h-8" />
                    <div className="hidden md:flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-blue-50 border border-blue-100">
                        <UserCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-800 truncate max-w-[160px]">
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
                    <div className="hidden md:block">
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
                    
                    {/* Mobile dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="md:hidden">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <span>{user.email}</span>
                            {profile?.role && (
                              <span className="text-xs text-blue-600">{ROLE_LABELS[profile.role]}</span>
                            )}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="flex items-center cursor-pointer">
                            <UserCircle2 className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Desktop user dropdown menu */}
                    <div className="hidden md:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100">
                            <UserCircle2 className="h-4 w-4" />
                            <span>Menu</span>
                            <ChevronDown className="h-3 w-3 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/profile" className="flex items-center cursor-pointer">
                              <UserCircle2 className="h-4 w-4 mr-2" />
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/settings" className="flex items-center cursor-pointer">
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          <div className="container mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
