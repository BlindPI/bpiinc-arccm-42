
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Settings, 
  BarChart3, 
  UserPlus,
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react';
import { SimplifiedMemberTable } from '../professional/SimplifiedMemberTable';

export function FunctionalTeamManagementHub() {
  const { user } = useAuth();
  const { data: userTeams = [], isLoading } = useTeamMemberships();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const primaryTeam = userTeams.find(tm => tm.role === 'ADMIN') || userTeams[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your teams and collaborate with members
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create or join a team to start collaborating with others.
            </p>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Team Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTeams.map((teamMembership) => (
                <Card key={teamMembership.team_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {teamMembership.teams?.name || 'Team'}
                      </CardTitle>
                      <Badge variant={teamMembership.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {teamMembership.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {teamMembership.teams?.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Location: {teamMembership.teams?.locations?.name || 'None'}</span>
                      <span>Status: {teamMembership.teams?.status || 'Active'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex flex-col h-20">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-xs">Schedule Meeting</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-xs">Team Chat</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-xs">Team Reports</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-20">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {primaryTeam && (
              <SimplifiedMemberTable
                teamId={primaryTeam.team_id}
                members={[]} // This would be populated with actual team members
                onMemberUpdated={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                  <p>Team activity will appear here as members collaborate.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Team Configuration</h3>
                  <p>Manage team settings and preferences here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
