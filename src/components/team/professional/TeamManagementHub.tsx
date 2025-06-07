
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  Crown,
  Workflow,
  Archive
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';

// Import existing components
import { SimplifiedMemberTable } from './SimplifiedMemberTable';

// Import new enterprise components
import { EnterpriseRoleManager } from '../enterprise/EnterpriseRoleManager';
import { TeamGovernanceManager } from '../enterprise/TeamGovernanceManager';
import { TeamLifecycleManager } from '../enterprise/TeamLifecycleManager';

export function TeamManagementHub() {
  const { user } = useAuth();
  const { data: userTeams = [], isLoading } = useTeamMemberships();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('members');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTeam = selectedTeam 
    ? userTeams.find(t => t.team_id === selectedTeam)
    : userTeams[0];

  const currentUserRole = currentTeam?.role || 'MEMBER';
  const isEnterpriseUser = ['SA', 'AD', 'AP'].includes(user?.profile?.role);

  if (!currentTeam) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
        <p className="text-muted-foreground">You are not a member of any teams.</p>
      </div>
    );
  }

  const getTabsList = () => {
    const baseTabs = [
      { id: 'members', label: 'Members', icon: Users },
      { id: 'settings', label: 'Settings', icon: Settings }
    ];

    if (isEnterpriseUser || ['OWNER', 'LEAD', 'ADMIN'].includes(currentUserRole)) {
      baseTabs.push(
        { id: 'roles', label: 'Enterprise Roles', icon: Crown },
        { id: 'governance', label: 'Governance', icon: Workflow },
        { id: 'lifecycle', label: 'Lifecycle', icon: Archive }
      );
    }

    return baseTabs;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members, roles, and settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {currentUserRole}
          </Badge>
          {isEnterpriseUser && (
            <Badge variant="default" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Enterprise
            </Badge>
          )}
        </div>
      </div>

      {/* Team Selector */}
      {userTeams.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Active Team:</span>
              <div className="flex gap-2">
                {userTeams.map((team) => (
                  <button
                    key={team.team_id}
                    onClick={() => setSelectedTeam(team.team_id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      team.team_id === (selectedTeam || userTeams[0].team_id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {team.teams?.name || 'Unnamed Team'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentTeam.teams?.name || 'Team'}
          </CardTitle>
          {currentTeam.teams?.description && (
            <p className="text-muted-foreground">{currentTeam.teams.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Management Tabs */}
      <Card className="border-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b bg-muted/30">
            <TabsList className="w-full justify-start bg-transparent">
              {getTabsList().map((tab) => {
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

          <CardContent className="p-6">
            <TabsContent value="members" className="m-0">
              <SimplifiedMemberTable
                teamId={currentTeam.team_id}
                members={[]} // This would be populated from the team data
                onMemberUpdated={() => {}}
              />
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Team Settings</h3>
                <p>Configure team preferences and general settings</p>
              </div>
            </TabsContent>

            {/* Enterprise Tabs */}
            {(isEnterpriseUser || ['OWNER', 'LEAD', 'ADMIN'].includes(currentUserRole)) && (
              <>
                <TabsContent value="roles" className="m-0">
                  <EnterpriseRoleManager
                    teamId={currentTeam.team_id}
                    members={[]} // This would be populated from the team data
                    currentUserRole={currentUserRole}
                    onMemberUpdated={() => {}}
                  />
                </TabsContent>

                <TabsContent value="governance" className="m-0">
                  <TeamGovernanceManager
                    teamId={currentTeam.team_id}
                    currentUserRole={currentUserRole}
                  />
                </TabsContent>

                <TabsContent value="lifecycle" className="m-0">
                  <TeamLifecycleManager
                    teamId={currentTeam.team_id}
                    teamData={currentTeam.teams}
                    currentUserRole={currentUserRole}
                  />
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
