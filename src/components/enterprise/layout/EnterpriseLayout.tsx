
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnterpriseHeader } from './EnterpriseHeader';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { useProfile } from '@/hooks/useProfile';

export function EnterpriseLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <EnterpriseHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userProfile={profile}
      />
      
      <div className="flex pt-16">
        <EnterpriseSidebar 
          open={sidebarOpen}
          userRole={profile?.role}
          onClose={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className={cn(
          'flex-1 transition-all duration-300 p-6',
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        )}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
