
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
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/utils/routeUtils";

const AppRoutes = () => {
  const { user, loading, authReady } = useAuth();
  
  // Common props for protected routes
  const protectedProps = {
    user,
    loading,
    authReady
  };
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/verification" element={<CertificateVerification />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      
      {/* Protected routes */}
      <Route path="/" element={<Index />} />
      <Route path="/courses" element={
        <ProtectedRoute {...protectedProps}>
          <Courses />
        </ProtectedRoute>
      } />
      <Route path="/locations" element={
        <ProtectedRoute {...protectedProps}>
          <Locations />
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <ProtectedRoute {...protectedProps}>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute {...protectedProps}>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/supervision" element={
        <ProtectedRoute {...protectedProps}>
          <Supervision />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute {...protectedProps}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/certifications" element={
        <ProtectedRoute {...protectedProps}>
          <Certifications />
        </ProtectedRoute>
      } />
      <Route path="/role-management" element={
        <ProtectedRoute {...protectedProps}>
          <RoleManagement />
        </ProtectedRoute>
      } />
      <Route path="/progression-paths" element={
        <ProtectedRoute {...protectedProps}>
          <ProgressionPathBuilderPage />
        </ProtectedRoute>
      } />
      <Route path="/certificate-analytics" element={
        <ProtectedRoute {...protectedProps}>
          <CertificateAnalyticsPage />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
export { AppRoutes };
