
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PublicSidebar } from "@/components/PublicSidebar";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Don't show sidebar on certain public pages for cleaner UX
  const hideSidebarPages = ["/landing", "/auth", "/auth/signin", "/auth/signup"];
  const shouldShowSidebar = !hideSidebarPages.includes(location.pathname);
  
  if (!shouldShowSidebar) {
    // Simplified layout without sidebar for landing and auth pages
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        {children}
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <PublicSidebar />
        <main className="flex-1 overflow-x-hidden">
          <header className="border-b bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-30 transition-all duration-200">
            <div className="container mx-auto px-4 flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger>
                  <Menu className="h-5 w-5 text-gray-600 hover:text-primary transition-colors" />
                </SidebarTrigger>
                <div className="flex items-center">
                  <Link to="/landing" className="hover:opacity-80 transition-opacity">
                    <img
                      src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                      alt="Assured Response Logo"
                      className="h-9 w-auto object-contain rounded bg-white shadow-sm"
                      style={{ minWidth: '110px' }}
                    />
                  </Link>
                  <div className="hidden md:flex flex-col ml-4">
                    <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                      Certificate Management System
                    </h1>
                    <span className="text-xs text-blue-600 font-medium">
                      Public Access
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link to="/auth/signin">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
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
