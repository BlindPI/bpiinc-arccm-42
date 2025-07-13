import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedTeamService } from '@/services/team/unifiedTeamService';
import { TeamCreateForm } from './TeamCreateForm';
import { TeamEditForm } from './TeamEditForm';
import { TeamMemberManager } from './TeamMemberManager';
import { EnhancedTeamCard } from '@/components/teams/EnhancedTeamCard';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  Plus,
  Settings,
  TrendingUp,
  Shield,
  MapPin,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EnhancedTeam, TeamAnalytics, ComplianceMetrics } from '@/services/team/unifiedTeamService';

interface AdminTeamInterfaceProps {
  teams: EnhancedTeam[];
  analytics?: TeamAnalytics;
  complianceMetrics?: ComplianceMetrics;
  onRefresh: () => void;
}

export function AdminTeamInterface({ 
  teams, 
  analytics, 
  complianceMetrics, 
  onRefresh 
}: AdminTeamInterfaceProps) {
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTeamAction = async (action: string, teamId: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'archive':
          await UnifiedTeamService.archiveTeam(teamId, true);
          toast.success('Team archived successfully');
          break;
        case 'restore':
          await UnifiedTeamService.archiveTeam(teamId, false);
          toast.success('Team restored successfully');
          break;
        case 'delete':
          await UnifiedTeamService.deleteTeam(teamId);
          toast.success('Team deleted successfully');
          break;
        default:
          break;
      }
      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${action} team: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New Team</h2>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Back to Teams
          </Button>
        </div>
        <TeamCreateForm
          onSuccess={() => {
            setShowCreateForm(false);
            onRefresh();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (showEditForm && selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Team: {selectedTeam.name}</h2>
          <Button variant="outline" onClick={() => setShowEditForm(false)}>
            Back to Team
          </Button>
        </div>
        <TeamEditForm
          team={selectedTeam}
          onSuccess={() => {
            setShowEditForm(false);
            onRefresh();
          }}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
            <p className="text-muted-foreground">
              {selectedTeam.description || 'Team management and operations'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTeam(null)}>
            Back to Teams
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.member_count || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{selectedTeam.performance_score || 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge className="mt-1">{selectedTeam.status}</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <TeamMemberManager
              teamId={selectedTeam.id}
              teamName={selectedTeam.name}
              canManageMembers={true}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Team Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced analytics dashboard will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Compliance tracking and reporting will be implemented here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Team Settings
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                      <p className="text-sm">{selectedTeam.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-sm">
                        <Badge variant={selectedTeam.status === 'active' ? 'default' : 'secondary'}>
                          {selectedTeam.status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm">{selectedTeam.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-sm">{selectedTeam.location?.name || 'No location set'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Team Actions</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTeamAction('archive', selectedTeam.id)}
                        disabled={isLoading}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Team
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${selectedTeam.name}"? This action cannot be undone.`)) {
                            handleTeamAction('delete', selectedTeam.id);
                            setSelectedTeam(null);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Providers
          </Button>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {/* Professional Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <EnhancedTeamCard
            key={team.id}
            team={team}
            onViewDetails={() => setSelectedTeam(team)}
            onManage={() => setSelectedTeam(team)}
          />
        ))}
      </div>
    </div>
  );
}