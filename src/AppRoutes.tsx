
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutRouter } from '@/components/LayoutRouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import UserManagementPage from '@/pages/UserManagementPage';
import Certifications from '@/pages/Certifications';
import Courses from '@/pages/Courses';
import Settings from '@/pages/Settings';
import Analytics from '@/pages/Analytics';
import Automation from '@/pages/Automation';
import Integrations from '@/pages/Integrations';
import AcceptInvitation from '@/pages/AcceptInvitation';
import CertificateVerification from '@/pages/CertificateVerification';
import { Toaster } from '@/components/ui/sonner';

export const AppRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/verify" element={<CertificateVerification />} />
        <Route path="/*" element={<LayoutRouter />}>
          <Route 
            index 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="certificates" 
            element={
              <ProtectedRoute>
                <Certifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="courses" 
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="automation" 
            element={
              <ProtectedRoute>
                <Automation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="integrations" 
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
};
