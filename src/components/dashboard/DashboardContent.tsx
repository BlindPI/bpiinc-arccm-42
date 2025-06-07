
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useEnhancedTeamContext } from '@/hooks/useEnhancedTeamContext';
import AdminDashboard from './role-dashboards/AdminDashboard';
import InstructorDashboard from './role-dashboards/InstructorDashboard';
import StudentDashboard from './role-dashboards/StudentDashboard';
import { EnhancedTeamDashboard } from './team/EnhancedTeamDashboard';
import { TeamAdministrationDashboard } from './admin/TeamAdministrationDashboard';

export default function DashboardContent() {
  const { user } = useAuth();
  const { config } = useDashboardConfig();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [dashboardMode, setDashboardMode] = useState<'personal' | 'team' | 'organization'>('personal');
  
  const {
    currentTeam,
    allTeams,
    isSystemAdmin,
    hasTeamMembership,
    shouldRestrictData
  } = useEnhancedTeamContext(selectedTeamId);

  if (!user || !user.profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const profile = user.profile;

  // Determine default dashboard mode based on user context
  React.useEffect(() => {
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

  // Render dashboard based on mode and user role
  switch (dashboardMode) {
    case 'organization':
      // Organization-level dashboard (System Admins only)
      if (isSystemAdmin) {
        if (['SA', 'AD'].includes(profile.role)) {
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
      switch (profile.role) {
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
              <InstructorDashboard config={config} profile={profile} />
              
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
              <StudentDashboard config={config} profile={profile} />
              
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
