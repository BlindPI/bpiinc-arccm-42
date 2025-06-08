
import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { LayoutRouter } from '@/components/LayoutRouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
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
import Profile from '@/pages/Profile';
import Locations from '@/pages/Locations';
import Reports from '@/pages/Reports';
import Teams from '@/pages/Teams';
import EnhancedTeams from '@/pages/EnhancedTeams';
import Supervision from '@/pages/Supervision';
import Enrollments from '@/pages/Enrollments';
import TrainingHub from '@/pages/TrainingHub';
import EnrollmentManagement from '@/pages/EnrollmentManagement';
import ProgressionPathBuilderPage from '@/pages/ProgressionPathBuilder';
import ExecutiveDashboardPage from '@/pages/ExecutiveDashboard';
import ReportSchedulerPage from '@/pages/ReportScheduler';
import CertificateAnalyticsPage from '@/pages/CertificateAnalytics';
import InstructorPerformancePage from '@/pages/InstructorPerformance';
import SystemMonitoring from '@/pages/SystemMonitoring';
import RoleManagement from '@/pages/RoleManagement';
import Rosters from '@/pages/Rosters';
import Notifications from '@/pages/Notifications';
import LandingPage from '@/pages/LandingPage';
import AuthorizedProviders from '@/pages/AuthorizedProviders';
import CRM from '@/pages/CRM';
import LeadsManagement from '@/pages/LeadsManagement';
import OpportunitiesManagement from '@/pages/OpportunitiesManagement';
import RevenueAnalytics from '@/pages/RevenueAnalytics';

export function AppRoutes() {
  return (
    <LayoutRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth" element={<Outlet />}>
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route index element={<Navigate to="signin" replace />} />
        </Route>
        
        {/* Mixed Access Routes */}
        <Route path="/verify" element={<CertificateVerification />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/enhanced-teams" element={<ProtectedRoute><EnhancedTeams /></ProtectedRoute>} />
        <Route path="/role-management" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
        <Route path="/supervision" element={<ProtectedRoute><Supervision /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Certifications /></ProtectedRoute>} />
        <Route path="/certificate-analytics" element={<ProtectedRoute><CertificateAnalyticsPage /></ProtectedRoute>} />
        <Route path="/rosters" element={<ProtectedRoute><Rosters /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} />
        <Route path="/enrollment-management" element={<ProtectedRoute><EnrollmentManagement /></ProtectedRoute>} />
        <Route path="/training-hub" element={<ProtectedRoute><TrainingHub /></ProtectedRoute>} />
        <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/executive-dashboard" element={<ProtectedRoute><ExecutiveDashboardPage /></ProtectedRoute>} />
        <Route path="/report-scheduler" element={<ProtectedRoute><ReportSchedulerPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
        <Route path="/progression-path-builder" element={<ProtectedRoute><ProgressionPathBuilderPage /></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/system-monitoring" element={<ProtectedRoute><SystemMonitoring /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
        <Route path="/crm/leads" element={<ProtectedRoute><LeadsManagement /></ProtectedRoute>} />
        <Route path="/crm/opportunities" element={<ProtectedRoute><OpportunitiesManagement /></ProtectedRoute>} />
        <Route path="/crm/revenue" element={<ProtectedRoute><RevenueAnalytics /></ProtectedRoute>} />
        <Route path="/instructor-performance" element={<ProtectedRoute><InstructorPerformancePage /></ProtectedRoute>} />
        <Route path="/authorized-providers" element={<ProtectedRoute><AuthorizedProviders /></ProtectedRoute>} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LayoutRouter>
  );
}
