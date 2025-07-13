
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { teamManagementService } from '@/services/team/teamManagementService';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';
import { Users, Building2, TrendingUp, Settings } from 'lucide-react';

export function EnhancedTeamManagement() {
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: async () => {
      const { realTeamDataService } = await import('@/services/team/realTeamDataService');
      return realTeamDataService.getAllTeams();
    }
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: async () => {
      const { realTeamDataService } = await import('@/services/team/realTeamDataService');
      return realTeamDataService.getSystemAnalytics();
    }
  });

  if (teamsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Enhanced Team Management</h2>
        <p className="text-muted-foreground">
          Advanced team operations and analytics
        </p>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-3xl font-bold">{analytics.totalTeams}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold">{analytics.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-3xl font-bold">{Math.round(analytics.averagePerformance)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-3xl font-bold">{Math.round(analytics.averageCompliance)}%</p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <div className="grid gap-4">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.location?.name || 'No location'} • {team.member_count || 0} members
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No teams found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
