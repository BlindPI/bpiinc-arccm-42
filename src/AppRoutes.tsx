
import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import Locations from "./pages/Locations";
import UserManagementPage from "./pages/UserManagementPage";
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
import CourseOfferingsManagement from "./pages/CourseOfferingsManagement";
import InstructorManagement from "./pages/InstructorManagement";
import TeachingSessionManagerPage from "./pages/TeachingSessionManager";
import TeamManagement from "./pages/TeamManagement";
import Teams from "./pages/Teams";
import EnrollmentManagement from "./pages/EnrollmentManagement";
import Enrollments from "./pages/Enrollments";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CourseScheduling from '@/pages/CourseScheduling';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/verification" element={<CertificateVerification />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      
      {/* Legacy auth route for compatibility */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/courses" element={
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      } />
      <Route path="/course-offerings" element={
        <ProtectedRoute>
          <CourseOfferingsManagement />
        </ProtectedRoute>
      } />
      <Route path="/course-scheduling" element={
        <ProtectedRoute>
          <CourseScheduling />
        </ProtectedRoute>
      } />
      <Route path="/instructors" element={
        <ProtectedRoute>
          <InstructorManagement />
        </ProtectedRoute>
      } />
      <Route path="/teaching-sessions" element={
        <ProtectedRoute>
          <TeachingSessionManagerPage />
        </ProtectedRoute>
      } />
      <Route path="/team-management" element={
        <ProtectedRoute>
          <TeamManagement />
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute>
          <Teams />
        </ProtectedRoute>
      } />
      <Route path="/enrollment-management" element={
        <ProtectedRoute>
          <EnrollmentManagement />
        </ProtectedRoute>
      } />
      <Route path="/enrollments" element={
        <ProtectedRoute>
          <Enrollments />
        </ProtectedRoute>
      } />
      <Route path="/locations" element={
        <ProtectedRoute>
          <Locations />
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <ProtectedRoute>
          <UserManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/supervision" element={
        <ProtectedRoute>
          <Supervision />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/certifications" element={
        <ProtectedRoute>
          <Certifications />
        </ProtectedRoute>
      } />
      <Route path="/role-management" element={
        <ProtectedRoute>
          <RoleManagement />
        </ProtectedRoute>
      } />
      <Route path="/progression-paths" element={
        <ProtectedRoute>
          <ProgressionPathBuilderPage />
        </ProtectedRoute>
      } />
      <Route path="/certificate-analytics" element={
        <ProtectedRoute>
          <CertificateAnalyticsPage />
        </ProtectedRoute>
      } />
      
      {/* Development/diagnostic routes */}
      <Route path="/auth-diagnostic" element={<AuthDiagnostic />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
export { AppRoutes };
