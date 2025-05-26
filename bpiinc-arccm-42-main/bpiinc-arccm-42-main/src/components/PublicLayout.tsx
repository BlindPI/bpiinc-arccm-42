import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PublicSidebar } from "./PublicSidebar";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <PublicSidebar />
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
              
              <div className="flex items-center gap-4">
                <Link 
                  to="/auth" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Sign In
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