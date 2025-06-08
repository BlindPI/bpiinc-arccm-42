
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { realTeamDataService } from '@/services/team/realTeamDataService';
import { 
  Users, 
  Plus, 
  Settings, 
  BarChart3, 
  UserPlus,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { RealMemberTable } from './RealMemberTable';

export function FunctionalTeamManagementHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: userTeams = [], isLoading, error } = useQuery({
    queryKey: ['user-teams', user?.id],
    queryFn: () => realTeamDataService.getUserTeams(user?.id || ''),
    enabled: !!user?.id
  });

  const { data: teamAnalytics } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => realTeamDataService.getTeamAnalytics()
  });

  const selectedTeam = selectedTeamId 
    ? userTeams.find(team => team.id === selectedTeamId)
    : userTeams[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Error Loading Teams</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your teams. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (userTeams.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your teams and collaborate with members
          </p>
        </div>
        <div className="flex items-center gap-4">
          {teamAnalytics && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{teamAnalytics.totalMembers} Members</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{teamAnalytics.averagePerformance}% Performance</span>
              </div>
            </div>
          )}
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
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
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      team.id === (selectedTeamId || userTeams[0].id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            {userTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {team.description || 'No description available'}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{team.member_count} members</span>
                    </div>
                    {team.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{team.location.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{team.performance_score}/100 Performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Type: {team.team_type.replace('_', ' ')}
                      </span>
                    </div>
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
          {selectedTeam && (
            <RealMemberTable
              teamId={selectedTeam.id}
              teamName={selectedTeam.name}
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
    </div>
  );
}
