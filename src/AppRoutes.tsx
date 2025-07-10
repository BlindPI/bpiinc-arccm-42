import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import LandingPage from '@/pages/LandingPage';
import CertificateVerification from '@/pages/CertificateVerification';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import Profile from '@/pages/Profile';
import Phase4CRM from '@/pages/Phase4CRM';

// Import all missing pages
import UnifiedTeams from '@/pages/UnifiedTeams';
import EnhancedTeams from '@/pages/EnhancedTeams';
import RoleManagement from '@/pages/RoleManagement';
import Supervision from '@/pages/Supervision';
import TrainingHub from '@/pages/TrainingHub';
import Courses from '@/pages/Courses';
import Enrollments from '@/pages/Enrollments';
import EnrollmentManagement from '@/pages/EnrollmentManagement';
import Locations from '@/pages/Locations';
import Certifications from '@/pages/Certifications';
import CertificateAnalytics from '@/pages/CertificateAnalytics';
import Rosters from '@/pages/Rosters';
import RevenueAnalytics from '@/pages/RevenueAnalytics';
import Analytics from '@/pages/Analytics';
import ReportScheduler from '@/pages/ReportScheduler';
import Reports from '@/pages/Reports';
import Automation from '@/pages/Automation';
import ProgressionPathBuilder from '@/pages/ProgressionPathBuilder';
import Integrations from '@/pages/Integrations';
import Notifications from '@/pages/Notifications';
import SystemMonitoring from '@/pages/SystemMonitoring';
import CampaignManagement from '@/pages/CampaignManagement';
import InstructorPerformance from '@/pages/InstructorPerformance';
import AuthorizedProviders from '@/pages/AuthorizedProviders';
import ModernTeams from '@/pages/ModernTeams';
import CRMDiagnostics from '@/pages/CRMDiagnostics';
import EmailWorkflowsPage from '@/app/crm/email-workflows/page';

export function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/verify" element={<CertificateVerification />} />
      
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
          <Phase4CRM />
        </ProtectedRoute>
      } />
      

      {/* User Management Routes - UNIFIED TEAMS */}
      <Route path="/teams" element={
        <ProtectedRoute>
          <UnifiedTeams />
        </ProtectedRoute>
      } />

      {/* DEPRECATED: Legacy team routes - redirect to unified teams */}
      <Route path="/enhanced-teams" element={
        <ProtectedRoute>
          <UnifiedTeams />
        </ProtectedRoute>
      } />

      <Route path="/modern-teams" element={
        <ProtectedRoute>
          <UnifiedTeams />
        </ProtectedRoute>
      } />

      <Route path="/role-management" element={
        <ProtectedRoute>
          <RoleManagement />
        </ProtectedRoute>
      } />

      <Route path="/supervision" element={
        <ProtectedRoute>
          <Supervision />
        </ProtectedRoute>
      } />

      {/* Training Management Routes */}
      <Route path="/training-hub" element={
        <ProtectedRoute>
          <TrainingHub />
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      } />

      <Route path="/enrollments" element={
        <ProtectedRoute>
          <Enrollments />
        </ProtectedRoute>
      } />

      <Route path="/enrollment-management" element={
        <ProtectedRoute>
          <EnrollmentManagement />
        </ProtectedRoute>
      } />

      <Route path="/locations" element={
        <ProtectedRoute>
          <Locations />
        </ProtectedRoute>
      } />

      {/* Certificate Routes */}
      <Route path="/certificates" element={
        <ProtectedRoute>
          <Certifications />
        </ProtectedRoute>
      } />

      <Route path="/certificate-analytics" element={
        <ProtectedRoute>
          <CertificateAnalytics />
        </ProtectedRoute>
      } />

      <Route path="/rosters" element={
        <ProtectedRoute>
          <Rosters />
        </ProtectedRoute>
      } />

      {/* CRM Routes - Phase 4 Unified */}
      <Route path="/crm/campaigns" element={
        <ProtectedRoute>
          <CampaignManagement />
        </ProtectedRoute>
      } />

      <Route path="/crm/revenue" element={
        <ProtectedRoute>
          <RevenueAnalytics />
        </ProtectedRoute>
      } />

      <Route path="/crm/email-workflows" element={
        <ProtectedRoute>
          <EmailWorkflowsPage />
        </ProtectedRoute>
      } />

      <Route path="/crm/diagnostics" element={
        <ProtectedRoute>
          <CRMDiagnostics />
        </ProtectedRoute>
      } />

      {/* Analytics & Reports Routes */}
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />

      <Route path="/report-scheduler" element={
        <ProtectedRoute>
          <ReportScheduler />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />

      {/* Compliance & Automation Routes */}
      <Route path="/automation" element={
        <ProtectedRoute>
          <Automation />
        </ProtectedRoute>
      } />

      <Route path="/progression-path-builder" element={
        <ProtectedRoute>
          <ProgressionPathBuilder />
        </ProtectedRoute>
      } />

      {/* System Administration Routes */}
      <Route path="/integrations" element={
        <ProtectedRoute>
          <Integrations />
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />

      <Route path="/system-monitoring" element={
        <ProtectedRoute>
          <SystemMonitoring />
        </ProtectedRoute>
      } />

      {/* Additional Routes */}
      <Route path="/instructor-performance" element={
        <ProtectedRoute>
          <InstructorPerformance />
        </ProtectedRoute>
      } />

      <Route path="/authorized-providers" element={
        <ProtectedRoute>
          <AuthorizedProviders />
        </ProtectedRoute>
      } />

      <Route path="*" element={
        user ? (
          <ProtectedRoute>
            <div>
              <h2>No matching route</h2>
              <span>{location.pathname}</span>
              {/* DEBUG: Log routing issue */}
              {(() => {
                console.log('🐛 ROUTING-DEBUG: No matching route found for:', location.pathname, 'Search params:', location.search);
                return null;
              })()}
            </div>
          </ProtectedRoute>
        ) : (
          <SignIn />
        )
      } />
    </Routes>
  );
}
