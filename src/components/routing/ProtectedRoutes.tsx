
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EnterpriseLayout } from '../enterprise/layout/EnterpriseLayout';

export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<EnterpriseLayout />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
