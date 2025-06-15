import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { HomePage } from './pages/HomePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SystemLogsPage } from './pages/SystemLogsPage';
import { ErrorLogsPage } from './pages/ErrorLogsPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import CRM from '@/pages/CRM';
import EmailCampaigns from '@/pages/EmailCampaigns';
import { BulkCRMOperations } from '@/components/crm/bulk/BulkCRMOperations';

export function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <HomePage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <DashboardLayout>
            <UsersPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/roles" element={
        <ProtectedRoute>
          <DashboardLayout>
            <RolesPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/permissions" element={
        <ProtectedRoute>
          <DashboardLayout>
            <PermissionsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/audit-logs" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AuditLogsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/system-logs" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SystemLogsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/error-logs" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ErrorLogsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuration" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ConfigurationPage />
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
        isLoggedIn ? (
          <ProtectedRoute>
            <DashboardLayout>
              <div>
                <h2>No matching route</h2>
                <span>{location.pathname}</span>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        ) : (
          <LoginPage />
        )
      } />
    </Routes>
  );
}
