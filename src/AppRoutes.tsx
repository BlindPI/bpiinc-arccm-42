
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Settings } from '@/pages/Settings';
import { UserManagement } from '@/pages/UserManagement';
import { Profile } from '@/pages/Profile';
import CRM from '@/pages/CRM';
import EmailCampaigns from '@/pages/EmailCampaigns';
import { BulkCRMOperations } from '@/components/crm/bulk/BulkCRMOperations';

export function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <DashboardLayout>
            <UserManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/crm" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CRM />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/email-campaigns" element={
        <ProtectedRoute>
          <DashboardLayout>
            <EmailCampaigns />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/bulk-operations" element={
        <ProtectedRoute>
          <DashboardLayout>
            <BulkCRMOperations />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={
        user ? (
          <ProtectedRoute>
            <DashboardLayout>
              <div>
                <h2>No matching route</h2>
                <span>{location.pathname}</span>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        ) : (
          <SignIn />
        )
      } />
    </Routes>
  );
}
