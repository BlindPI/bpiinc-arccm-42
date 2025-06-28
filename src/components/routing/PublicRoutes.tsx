
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import existing professional auth components
import Auth from '@/pages/Auth';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import LandingPage from '@/pages/LandingPage';

export function PublicRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/landing" element={<LandingPage />} />
      
      {/* Auth routes - using existing professional components */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      
      {/* Default redirect to landing for unauthenticated users */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
