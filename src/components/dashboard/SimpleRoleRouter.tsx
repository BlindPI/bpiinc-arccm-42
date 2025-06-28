
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { FixedRoleBasedDashboard } from './FixedRoleBasedDashboard';
import { LoadingDashboard } from './LoadingDashboard';

export function SimpleRoleRouter() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return <LoadingDashboard message="Loading profile..." />;
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load dashboard</p>
        </div>
      </div>
    );
  }

  return <FixedRoleBasedDashboard />;
}
