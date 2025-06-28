
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { useProfile } from '@/hooks/useProfile';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userProfile={profile}
      />
      
      <div className="flex">
        <AppSidebar 
          open={sidebarOpen}
          userRole={profile?.role}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0',
          'pt-16 p-6'
        )}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
