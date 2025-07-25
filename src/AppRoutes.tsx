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
// DIRECT: Bypassing wrapper redundancy
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import UserManagementPage from '@/pages/UserManagementPage';
import StudentManagement from '@/pages/StudentManagement';
import { ApiIntegrationManager } from '@/components/integration/ApiIntegrationManager';
import Profile from '@/pages/Profile';
import CRM from '@/pages/CRM';
import CRMAnalytics from '@/pages/CRMAnalytics';

// Import all pages
// UNIFIED: UnifiedTeams → Training Hub (team management consolidated)
// UNIFIED: RoleManagement → AdminHub
import Supervision from '@/pages/Supervision';
import Teams from '@/pages/Teams';
import Scheduling from '@/pages/Scheduling';
import TrainingOverview from '@/pages/TrainingOverview';
// UNIFIED: Courses, Locations, Rosters → TrainingHub
import Enrollments from '@/pages/Enrollments';
import Certifications from '@/pages/Certifications';
// UNIFIED: Admin Hub consolidation
import AdminHub from '@/pages/AdminHub';
import Analytics from '@/pages/Analytics';
import ReportScheduler from '@/pages/ReportScheduler';
import Reports from '@/pages/Reports';
import Automation from '@/pages/Automation';
import ProgressionPathBuilder from '@/pages/ProgressionPathBuilder';
// UNIFIED: System Admin components → AdminHub
import CampaignManagement from '@/pages/CampaignManagement';
import CRMHub from '@/pages/CRMHub';
import AuthorizedProviders from '@/pages/AuthorizedProviders';
import CRMDiagnostics from '@/pages/CRMDiagnostics';
import EmailWorkflowsPage from '@/app/crm/email-workflows/page';
// Removed AvailabilityManager - component deleted
import CourseManagement from '@/pages/CourseManagement';
import LocationManagement from '@/pages/LocationManagement';
import InstructorDashboard from '@/pages/InstructorDashboard';
import InstructorRosterDetail from '@/pages/InstructorRosterDetail';
import InstructorManagementSystem from '@/pages/instructor-system';
import MultiCourseTrainingHub from '@/pages/MultiCourseTrainingHub';
import Compliance from '@/pages/Compliance';

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
          <SettingsLayout />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <UserManagementPage />
        </ProtectedRoute>
      } />

      <Route path="/students" element={
        <ProtectedRoute>
          <StudentManagement />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/configuration" element={
        <ProtectedRoute>
          <SettingsLayout />
        </ProtectedRoute>
      } />

      <Route path="/crm" element={
        <ProtectedRoute>
          <CRM />
        </ProtectedRoute>
      } />

      <Route path="/crm/analytics" element={
        <ProtectedRoute>
          <CRMAnalytics />
        </ProtectedRoute>
      } />

      {/* DIRECT CLEAN PAGES - No More Nested Interfaces */}
      <Route path="/teams" element={
        <ProtectedRoute>
          <Teams />
        </ProtectedRoute>
      } />

      <Route path="/scheduling" element={
        <ProtectedRoute>
          <Scheduling />
        </ProtectedRoute>
      } />

      <Route path="/training-overview" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      {/* Legacy redirects */}
      <Route path="/enhanced-teams" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      <Route path="/modern-teams" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      <Route path="/training-hub" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      {/* NEW: Unified Training Management System */}
      <Route path="/training-management" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      {/* Multi-Course Training Hub */}
      <Route path="/multi-course-training" element={
        <ProtectedRoute>
          <MultiCourseTrainingHub />
        </ProtectedRoute>
      } />

      {/* Instructor System Hub */}
      <Route path="/instructor-system" element={
        <ProtectedRoute>
          <InstructorManagementSystem />
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute>
          <CourseManagement />
        </ProtectedRoute>
      } />

      <Route path="/enrollments" element={
        <ProtectedRoute>
          <Enrollments />
        </ProtectedRoute>
      } />

      <Route path="/locations" element={
        <ProtectedRoute>
          <LocationManagement />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/role-management" element={
        <ProtectedRoute>
          <AdminHub />
        </ProtectedRoute>
      } />

      <Route path="/supervision" element={
        <ProtectedRoute>
          <Supervision />
        </ProtectedRoute>
      } />

      {/* Availability Management Routes - Component removed */}

      {/* Certificate Routes */}
      <Route path="/certificates" element={
        <ProtectedRoute>
          <Certifications />
        </ProtectedRoute>
      } />

      {/* UNIFIED: Certificate Analytics → Analytics Hub */}
      <Route path="/certificate-analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />

      {/* UNIFIED: Rosters → Training Overview */}
      <Route path="/rosters" element={
        <ProtectedRoute>
          <TrainingOverview />
        </ProtectedRoute>
      } />

      {/* CRM Routes - Phase 4 Unified */}
      <Route path="/crm/hub" element={
        <ProtectedRoute>
          <CRMHub />
        </ProtectedRoute>
      } />

      <Route path="/crm/campaigns" element={
        <ProtectedRoute>
          <CampaignManagement />
        </ProtectedRoute>
      } />

      {/* UNIFIED: Revenue Analytics → Analytics Hub */}
      <Route path="/crm/revenue" element={
        <ProtectedRoute>
          <Analytics />
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
      <Route path="/compliance" element={
        <ProtectedRoute>
          <Compliance />
        </ProtectedRoute>
      } />

      <Route path="/compliance/admin" element={
        <ProtectedRoute>
          <Compliance />
        </ProtectedRoute>
      } />

      <Route path="/compliance/team" element={
        <ProtectedRoute>
          <Compliance />
        </ProtectedRoute>
      } />

      <Route path="/compliance/personal" element={
        <ProtectedRoute>
          <Compliance />
        </ProtectedRoute>
      } />

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
      {/* DIRECT: Integrations component */}
      <Route path="/integrations" element={
        <ProtectedRoute>
          <ApiIntegrationManager />
        </ProtectedRoute>
      } />

      {/* UNIFIED: Notifications → Admin Hub */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <AdminHub />
        </ProtectedRoute>
      } />

      {/* UNIFIED: System Monitoring → Admin Hub */}
      <Route path="/system-monitoring" element={
        <ProtectedRoute>
          <AdminHub />
        </ProtectedRoute>
      } />

      {/* NEW: Admin Hub route */}
      <Route path="/admin-hub" element={
        <ProtectedRoute>
          <AdminHub />
        </ProtectedRoute>
      } />

      {/* UNIFIED: Instructor Performance → Analytics Hub */}
      <Route path="/instructor-performance" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />

      <Route path="/authorized-providers" element={
        <ProtectedRoute>
          <AuthorizedProviders />
        </ProtectedRoute>
      } />

      {/* Instructor Routes */}
      <Route path="/instructor/dashboard" element={
        <ProtectedRoute>
          <InstructorDashboard />
        </ProtectedRoute>
      } />

      <Route path="/instructor/roster/:rosterId" element={
        <ProtectedRoute>
          <InstructorRosterDetail />
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
