import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CRMSidebar } from './CRMSidebar';
import { CRMTopBar } from './CRMTopBar';
import { CRMMobileNav } from './CRMMobileNav';
import { useAuthProvider } from '@/hooks/useAuthProvider';

interface CRMLayoutProps {
  children?: React.ReactNode;
}

export const CRMLayout: React.FC<CRMLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthProvider(navigate);

  // Check if user has CRM access (AD or SA roles)
  const hasCRMAccess = user?.role === 'AD' || user?.role === 'SA';

  if (!hasCRMAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the CRM system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300",
        sidebarCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <CRMSidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r">
            <CRMSidebar 
              collapsed={false}
              onToggleCollapse={() => {}}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        "lg:ml-64",
        sidebarCollapsed && "lg:ml-16"
      )}>
        {/* Top Bar */}
        <CRMTopBar 
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <CRMMobileNav />
        </div>
      </div>
    </div>
  );
};