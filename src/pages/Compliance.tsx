import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { Loader2 } from 'lucide-react';

export default function Compliance() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading compliance dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">
          Unable to load user profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <ComplianceDashboard
      userId={user.id}
      userRole={profile.role}
      displayName={profile.display_name || user.email || 'User'}
    />
  );
}
