// src/AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import Locations from "./pages/Locations";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Supervision from "./pages/Supervision";
import Settings from "./pages/Settings";
import Certifications from "./pages/Certifications";
import RoleManagement from "./pages/RoleManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import CertificateVerification from "./pages/CertificateVerification";
import ProgressionPathBuilderPage from "./pages/ProgressionPathBuilder";
import CertificateAnalyticsPage from "./pages/CertificateAnalytics";
import AuthDiagnostic from "./pages/AuthDiagnostic";
import NotificationDashboardPage from "./pages/NotificationDashboardPage";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/supervision" element={<Supervision />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/certifications" element={<Certifications />} />
      <Route path="/role-management" element={<RoleManagement />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/verification" element={<CertificateVerification />} />
      <Route path="/progression-paths" element={<ProgressionPathBuilderPage />} />
      <Route path="/certificate-analytics" element={<CertificateAnalyticsPage />} />
      <Route path="/auth-diagnostic" element={<AuthDiagnostic />} />
      <Route path="/notifications" element={<NotificationDashboardPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
export { AppRoutes };