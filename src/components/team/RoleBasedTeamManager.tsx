
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Building2, Settings, UserPlus, Eye, Crown } from 'lucide-react';
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
  const { shouldUseTeamDashboard, primaryTeam, teamRole, isSystemAdmin, hasTeamMembership } = useTeamContext();
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

  // CRITICAL FIX: For SA/AD users, ALWAYS show system-wide management interface
  // Do not redirect them to team collaboration views
  const useSystemAdminView = isSystemAdmin;

  // Determine available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [];

    if (useSystemAdminView) {
      baseTabs.push(
        { id: 'management', label: 'System Team Management', icon: Crown },
        { id: 'settings', label: 'System Settings', icon: Settings }
      );
      
      // Add team member view as optional tab if they are a team member
      if (hasTeamMembership && primaryTeam) {
        baseTabs.push(
          { id: 'myteam', label: 'My Team View', icon: Users }
        );
      }
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
          <h1 className="text-3xl font-bold tracking-tight">
            {useSystemAdminView ? 'System Team Administration' : 'Team Management'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {useSystemAdminView 
              ? 'Comprehensive system-wide team management and administration'
              : 'Manage teams, members, and collaboration based on your role'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {userRole}
          </Badge>
          {useSystemAdminView && (
            <Badge variant="default" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              System Admin
            </Badge>
          )}
          {hasTeamMembership && primaryTeam && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Member
            </Badge>
          )}
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
              {useSystemAdminView && <AdminTeamManagement />}
              {!useSystemAdminView && isInstructor() && <InstructorTeamView />}
              {!useSystemAdminView && userRole === 'AP' && <ProviderTeamManagement />}
              {!useSystemAdminView && !isInstructor() && userRole !== 'AP' && <StudentTeamView />}
            </TabsContent>

            {useSystemAdminView && (
              <>
                <TabsContent value="settings" className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">System Team Settings</h3>
                    <p>Advanced team configuration and system-wide settings</p>
                  </div>
                </TabsContent>

                {hasTeamMembership && primaryTeam && (
                  <TabsContent value="myteam" className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">My Team Participation</h3>
                          <p className="text-sm text-muted-foreground">
                            View your participation in: {primaryTeam.teams?.name || 'Team'}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {teamRole}
                        </Badge>
                      </div>
                      
                      {isInstructor() && <InstructorTeamView />}
                      {!isInstructor() && <StudentTeamView />}
                    </div>
                  </TabsContent>
                )}
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
