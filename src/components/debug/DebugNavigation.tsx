
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export const DebugNavigation: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  // Only show debug navigation for admins or in development
  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';
  const showDebugNav = isDev || isAdmin;
  
  if (!showDebugNav) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-2">
        <div className="text-xs font-medium mb-1 text-gray-300">Debug Tools</div>
        <div className="flex flex-col space-y-1">
          <Link 
            to="/debug/dashboard-data-test" 
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Dashboard Data
          </Link>
          <button
            onClick={() => {
              console.log('Current user:', user);
              console.log('Profile:', profile);
              alert('User info logged to console');
            }}
            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Log User Info
          </button>
        </div>
      </div>
    </div>
  );
};
