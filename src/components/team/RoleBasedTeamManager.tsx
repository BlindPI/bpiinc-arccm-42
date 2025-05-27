import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Building2, Settings, UserPlus, Eye } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';

// Import role-specific components
import { AdminTeamManagement } from './admin/AdminTeamManagement';
import { InstructorTeamView } from './instructor/InstructorTeamView';
import { StudentTeamView } from './student/StudentTeamView';
import { ProviderTeamManagement } from './provider/ProviderTeamManagement';
import { UniversalTeamWizard } from './wizard/UniversalTeamWizard';

export function RoleBasedTeamManager() {
  const { user } = useAuth();
  const { userRole, isAdmin, isInstructor, loading } = useRoleBasedAccess();
  const { shouldUseTeamDashboard, primaryTeam, teamRole } = useTeamContext();
  const [activeTab, setActiveTab] = useState('management');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground">Please log in to access team management.</p>
      </div>
    );
  }

  // If user should use team dashboard, show team-focused view
  if (shouldUseTeamDashboard && primaryTeam) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {primaryTeam.teams?.name || 'Team Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-2">
              Team management and collaboration for your assigned team
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {teamRole}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {primaryTeam.teams?.locations?.name || 'No Location'}
            </Badge>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Team Overview</h2>
              <span className="text-sm text-muted-foreground">
                Performance: {primaryTeam.teams?.performance_score || 0}%
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Show team-specific instructor or student view */}
            {isInstructor() && <InstructorTeamView />}
            {!isInstructor() && <StudentTeamView />}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [];

    if (isAdmin()) {
      baseTabs.push(
        { id: 'management', label: 'Team Management', icon: Shield },
        { id: 'settings', label: 'System Settings', icon: Settings }
      );
    } else if (isInstructor()) {
      baseTabs.push(
        { id: 'management', label: 'My Teams', icon: Users }
      );
    } else if (userRole === 'AP') {
      baseTabs.push(
        { id: 'management', label: 'Provider Teams', icon: Building2 }
      );
    } else {
      baseTabs.push(
        { id: 'management', label: 'My Teams', icon: Users }
      );
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teams, members, and collaboration based on your role
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {userRole}
          </Badge>
          {(isAdmin() || isInstructor() || userRole === 'AP') && (
            <UniversalTeamWizard userRole={userRole} />
          )}
        </div>
      </div>

      {/* Role-Based Content */}
      <Card className="border-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b bg-muted/30">
            <TabsList className="w-full justify-start bg-transparent">
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="management" className="m-0">
              {isAdmin() && <AdminTeamManagement />}
              {isInstructor() && !isAdmin() && <InstructorTeamView />}
              {userRole === 'AP' && <ProviderTeamManagement />}
              {!isAdmin() && !isInstructor() && userRole !== 'AP' && <StudentTeamView />}
            </TabsContent>

            {isAdmin() && (
              <TabsContent value="settings" className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">System Team Settings</h3>
                  <p>Advanced team configuration and system-wide settings</p>
                </div>
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
