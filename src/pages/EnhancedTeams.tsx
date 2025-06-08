
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { EnhancedTeamManagementHub } from '@/components/team/enhanced/EnhancedTeamManagementHub';
import { EnterpriseTeamAdminDashboard } from '@/components/admin/enterprise/EnterpriseTeamAdminDashboard';
import { TeamModeSelector } from '@/components/team/TeamModeSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function EnhancedTeams() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Check if user has enterprise access
  const hasEnterpriseAccess = ['SA', 'AD', 'AP'].includes(profile?.role);

  // Redirect non-enterprise users to regular teams
  if (!hasEnterpriseAccess) {
    return <Navigate to="/teams" replace />;
  }

  const isSystemAdmin = profile?.role === 'SA';

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            Enterprise Team Management
          </h1>
          <p className="text-muted-foreground">
            Advanced team governance, compliance monitoring, and cross-team analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Enterprise Mode
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {profile?.role}
          </Badge>
        </div>
      </div>

      {/* Mode Selector */}
      <TeamModeSelector />

      {/* Enterprise Warning for Non-System Admins */}
      {!isSystemAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Enterprise Features: Some advanced features may require System Administrator permissions
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Enterprise Dashboard */}
      {isSystemAdmin ? (
        <EnterpriseTeamAdminDashboard />
      ) : (
        <EnhancedTeamManagementHub />
      )}
    </div>
  );
}
