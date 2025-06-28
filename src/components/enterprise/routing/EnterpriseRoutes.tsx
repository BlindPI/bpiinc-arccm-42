
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EnterpriseDashboard } from '../dashboard/EnterpriseDashboard';

export function EnterpriseRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <EnterpriseDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Placeholder routes for future pages */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600">Coming soon - Enterprise user management interface</p>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/teams" 
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Management</h2>
              <p className="text-gray-600">Coming soon - Enterprise team management interface</p>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/certificates" 
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Certificate Management</h2>
              <p className="text-gray-600">Coming soon - Enterprise certificate management interface</p>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/crm" 
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">CRM System</h2>
              <p className="text-gray-600">Coming soon - Enterprise CRM interface</p>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600">Coming soon - Enterprise settings interface</p>
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
