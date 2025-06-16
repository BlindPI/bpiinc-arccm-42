import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ModernTeamDashboard } from '@/components/team/modern';
import { TeamErrorBoundary } from '@/components/team/TeamErrorBoundary';

export default function ModernTeams() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <TeamErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ModernTeamDashboard
            userRole="SA" // Default to SA for now, can be enhanced later
            userId={user.id}
          />
        </div>
      </div>
    </TeamErrorBoundary>
  );
}