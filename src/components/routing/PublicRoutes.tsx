
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignInPage } from '../auth/SignInPage';
import { SignUpPage } from '../auth/SignUpPage';
import { LandingPage } from '../marketing/LandingPage';

export function PublicRoutes() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth/signin" element={<SignInPage />} />
      <Route path="/auth/signup" element={<SignUpPage />} />
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
