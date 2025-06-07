
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useEnhancedTeamContext } from '@/hooks/useEnhancedTeamContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import { EnhancedTeamDashboard } from './team/EnhancedTeamDashboard';
import { TeamAdministrationDashboard } from './admin/TeamAdministrationDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { config } = useDashboardConfig();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [dashboardMode, setDashboardMode] = useState<'personal' | 'team' | 'organization'>('personal');
  
  console.log('🔧 DASHBOARD-CONTENT: Render state:', {
    user: !!user,
    userProfile: !!user?.profile,
    profile: !!profile,
    authLoading,
    profileLoading,
    userRole: profile?.role || user?.profile?.role || 'unknown'
  });

  // Show loading while auth is still initializing
  if (authLoading) {
    console.log('🔧 DASHBOARD-CONTENT: Auth still loading');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If no user, this should be handled by route protection
  if (!user) {
    console.log('🔧 DASHBOARD-CONTENT: No user found');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No user session found</p>
        </div>
      </div>
    );
  }

  // Get user role from either profile or user.profile
  const userRole = profile?.role || user?.profile?.role;
  
  // If we don't have a role yet and profile is still loading, show loading
  if (!userRole && profileLoading) {
    console.log('🔧 DASHBOARD-CONTENT: Profile still loading');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If we still don't have a role, show a fallback dashboard
  if (!userRole) {
    console.log('🔧 DASHBOARD-CONTENT: No role found, showing fallback');
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">Profile Setup Required</h3>
          <p className="text-yellow-700 mt-2">
            Your account doesn't have a role assigned yet. Please contact your administrator.
          </p>
        </div>
        <StudentDashboard config={config} profile={{ role: 'ST' } as any} />
      </div>
    );
  }

  console.log('🔧 DASHBOARD-CONTENT: Rendering dashboard for role:', userRole);

  const {
    currentTeam,
    allTeams,
    isSystemAdmin,
    hasTeamMembership,
    shouldRestrictData
  } = useEnhancedTeamContext(selectedTeamId);

  // Determine default dashboard mode based on user context
  useEffect(() => {
    if (isSystemAdmin) {
      setDashboardMode('organization');
    } else if (hasTeamMembership && allTeams.length > 0) {
      setDashboardMode('team');
      if (!selectedTeamId && currentTeam) {
        setSelectedTeamId(currentTeam.team_id);
      }
    } else {
      setDashboardMode('personal');
    }
  }, [isSystemAdmin, hasTeamMembership, allTeams.length, currentTeam, selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  const handleModeChange = (mode: 'personal' | 'team' | 'organization') => {
    setDashboardMode(mode);
    
    // Auto-select team when switching to team mode
    if (mode === 'team' && !selectedTeamId && currentTeam) {
      setSelectedTeamId(currentTeam.team_id);
    }
  };

  // Create a profile object for compatibility
  const profileForDashboard = profile || user.profile || { role: userRole };

  // Render dashboard based on mode and user role
  switch (dashboardMode) {
    case 'organization':
      // Organization-level dashboard (System Admins only)
      if (isSystemAdmin) {
        if (['SA', 'AD'].includes(userRole)) {
          return (
            <div className="space-y-6">
              <TeamAdministrationDashboard />
              <AdminDashboard />
            </div>
          );
        }
      }
      // Fallback to team dashboard if not system admin
      setDashboardMode('team');
      return null;

    case 'team':
      // Team-level dashboard
      if (hasTeamMembership) {
        return (
          <EnhancedTeamDashboard
            selectedTeamId={selectedTeamId}
            onTeamChange={handleTeamChange}
            dashboardMode={dashboardMode}
            onModeChange={handleModeChange}
          />
        );
      }
      // Fallback to personal dashboard if no team membership
      setDashboardMode('personal');
      return null;

    case 'personal':
    default:
      // Personal dashboard based on user role
      switch (userRole) {
        case 'SA':
        case 'AD':
          return (
            <div className="space-y-6">
              {/* Personal admin dashboard */}
              <AdminDashboard />
              
              {/* Show team selector if they have teams */}
              {hasTeamMembership && (
                <EnhancedTeamDashboard
                  selectedTeamId={selectedTeamId}
                  onTeamChange={handleTeamChange}
                  dashboardMode="personal"
                  onModeChange={handleModeChange}
                />
              )}
            </div>
          );
        
        case 'IC':
        case 'IP':
        case 'IT':
          return (
            <div className="space-y-6">
              {/* Personal instructor dashboard */}
              <InstructorDashboard config={config} profile={profileForDashboard} />
              
              {/* Show team dashboard if they're part of a team */}
              {hasTeamMembership && (
                <EnhancedTeamDashboard
                  selectedTeamId={selectedTeamId}
                  onTeamChange={handleTeamChange}
                  dashboardMode="personal"
                  onModeChange={handleModeChange}
                />
              )}
            </div>
          );
        
        case 'ST':
        default:
          return (
            <div className="space-y-6">
              {/* Personal student dashboard */}
              <StudentDashboard config={config} profile={profileForDashboard} />
              
              {/* Show team dashboard if they're part of a team */}
              {hasTeamMembership && (
                <EnhancedTeamDashboard
                  selectedTeamId={selectedTeamId}
                  onTeamChange={handleTeamChange}
                  dashboardMode="personal"
                  onModeChange={handleModeChange}
                />
              )}
            </div>
          );
      }
  }
}
