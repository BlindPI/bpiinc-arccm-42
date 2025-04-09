import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Supervision from "./pages/Supervision";
import Settings from "./pages/Settings";
import Certifications from "./pages/Certifications";
import RoleManagement from "./pages/RoleManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import CertificateVerification from "./pages/CertificateVerification";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/supervision" element={<Supervision />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/certifications" element={<Certifications />} />
      <Route path="/role-management" element={<RoleManagement />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/verification" element={<CertificateVerification />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
