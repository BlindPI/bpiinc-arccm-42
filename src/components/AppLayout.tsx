
import React from 'react';
import { Outlet } from 'react-router-dom';

// Simple wrapper component that preserves all existing layout logic
// while providing the Outlet for React Router
const AppLayout: React.FC = () => {
  return <Outlet />;
};

export default AppLayout;
