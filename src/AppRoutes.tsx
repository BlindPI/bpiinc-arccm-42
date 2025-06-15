
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Dashboard from '@/pages/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import Profile from '@/pages/Profile';
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
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/configuration" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/crm" element={
        <ProtectedRoute>
          <CRM />
        </ProtectedRoute>
      } />
      
      <Route path="/email-campaigns" element={
        <ProtectedRoute>
          <EmailCampaigns />
        </ProtectedRoute>
      } />
      
      <Route path="/bulk-operations" element={
        <ProtectedRoute>
          <BulkCRMOperations />
        </ProtectedRoute>
      } />

      <Route path="*" element={
        user ? (
          <ProtectedRoute>
            <div>
              <h2>No matching route</h2>
              <span>{location.pathname}</span>
            </div>
          </ProtectedRoute>
        ) : (
          <SignIn />
        )
      } />
    </Routes>
  );
}
