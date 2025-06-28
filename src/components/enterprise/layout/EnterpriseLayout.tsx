
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnterpriseHeader } from './EnterpriseHeader';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { EnterpriseDashboard } from '../dashboard/EnterpriseDashboard';
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
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        )}>
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<EnterpriseDashboard />} />
              <Route path="/users" element={
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
                  <p className="text-gray-600">Coming soon - Enterprise user management interface</p>
                </div>
              } />
              <Route path="/teams" element={
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Management</h2>
                  <p className="text-gray-600">Coming soon - Enterprise team management interface</p>
                </div>
              } />
              <Route path="/certificates" element={
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Certificate Management</h2>
                  <p className="text-gray-600">Coming soon - Enterprise certificate management interface</p>
                </div>
              } />
              <Route path="/crm" element={
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">CRM System</h2>
                  <p className="text-gray-600">Coming soon - Enterprise CRM interface</p>
                </div>
              } />
              <Route path="/settings" element={
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
                  <p className="text-gray-600">Coming soon - Enterprise settings interface</p>
                </div>
              } />
              <Route path="*" element={<EnterpriseDashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
