
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingDashboard } from '@/components/dashboard/LoadingDashboard';

// Import all valid page components
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import Teams from '@/pages/Teams';
import Phase4CRM from '@/pages/Phase4CRM';
import Certifications from '@/pages/Certifications';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import ComplianceAdminDashboard from '@/pages/ComplianceAdminDashboard';
import ComplianceProviderDashboard from '@/pages/ComplianceProviderDashboard';
import Profile from '@/pages/Profile';
import Automation from '@/pages/Automation';

export function ProtectedRoutes() {
  return (
    <Routes>
      {/* Default redirect to dashboard for root path */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Main Dashboard Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Compliance Routes */}
      <Route path="/compliance-dashboard/admin" element={<ComplianceAdminDashboard />} />
      <Route path="/compliance-dashboard/provider" element={<ComplianceProviderDashboard />} />
      
      {/* Core Application Routes */}
      <Route path="/teams" element={<Teams />} />
      <Route path="/crm" element={<Phase4CRM />} />
      <Route path="/certificates" element={<Certifications />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/automation" element={<Automation />} />
      
      {/* User Management */}
      <Route path="/users" element={<UserManagement />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* Catch-all route for unknown paths - redirect to dashboard instead of creating conflicts */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
