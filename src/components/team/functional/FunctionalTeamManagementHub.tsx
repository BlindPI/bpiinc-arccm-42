
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, BarChart3, Users } from 'lucide-react';
import { RealMemberTable } from './RealMemberTable';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { TeamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { RealTeamDataService } from '@/services/team/realTeamDataService';

interface FunctionalTeamManagementHubProps {
  userRole?: string;
}

export function FunctionalTeamManagementHub({ userRole }: FunctionalTeamManagementHubProps) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => RealTeamDataService.getEnhancedTeams()
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => TeamAnalyticsService.getGlobalAnalytics()
  });

  const canManageTeams = ['SA', 'AD'].includes(userRole || '');

  if (isLoadingTeams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management Hub</h1>
          <p className="text-muted-foreground">
            Comprehensive team oversight and member management
          </p>
        </div>
        {canManageTeams && (
          <Button onClick={() => setShowAddMemberModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* System Overview */}
      {systemAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{systemAnalytics.total_teams}</p>
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{systemAnalytics.total_members}</p>
                </div>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-2xl font-bold">{systemAnalytics.average_performance}%</p>
                </div>
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
                <Settings className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {team.location?.name} • {team.member_count ?? 0} members
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {Math.round(team.performance_score)}% Performance
                  </Badge>
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RealMemberTable teamId={team.id} userRole={userRole} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          teamId={selectedTeamId}
        />
      )}
    </div>
  );
}
