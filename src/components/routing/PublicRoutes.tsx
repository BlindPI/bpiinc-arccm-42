
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import Verify from '@/pages/Verify';

export function PublicRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/landing" element={<Landing />} />
      
      {/* Auth routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/signin" element={<AuthPage />} />
      <Route path="/auth/signup" element={<AuthPage />} />
      
      {/* Mixed access routes */}
      <Route path="/verify" element={<Verify />} />
      
      {/* Default redirect to landing for unauthenticated users */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
