
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SignInPage } from '@/components/auth/SignInPage';
import { SignUpPage } from '@/components/auth/SignUpPage';
import { LandingPage } from '@/components/marketing/LandingPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EnterpriseDashboard } from '@/components/enterprise/dashboard/EnterpriseDashboard';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth/signin" element={<SignInPage />} />
      <Route path="/auth/signup" element={<SignUpPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <EnterpriseDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Default redirects */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
