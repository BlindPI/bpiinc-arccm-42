
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { 
  Users, 
  Plus, 
  Settings, 
  BarChart3, 
  Shield,
  Building2,
  Crown
} from 'lucide-react';

export function AdminTeamManagement() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => teamManagementService.getAllTeams()
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => teamManagementService.getSystemWideAnalytics()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemAnalytics?.totalTeams || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemAnalytics?.totalMembers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(systemAnalytics?.averagePerformance || 0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Avg Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(systemAnalytics?.averageCompliance || 0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            System Team Administration
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage all teams across the organization
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
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
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {team.description || 'No description available'}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-medium capitalize">{team.team_type}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Score:</span>
                    <div className="font-medium">{team.performance_score || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
            <p className="text-muted-foreground mb-4">
              No teams have been created in the system yet.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
