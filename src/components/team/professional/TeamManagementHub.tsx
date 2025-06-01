
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Download, Filter, Users, MapPin, TrendingUp } from 'lucide-react';
import { TeamTable } from './TeamTable';
import { CreateTeamDialog } from './CreateTeamDialog';
import { TeamMetrics } from './TeamMetrics';
import { BulkActionsPanel } from './BulkActionsPanel';
import { ExportDialog } from './ExportDialog';
import { TeamMemberManagementDialog } from '../TeamMemberManagementDialog';
import { toast } from 'sonner';
import type { EnhancedTeam } from '@/services/team/teamManagementService';
import { parseJsonToRecord } from '@/types/user-management';

interface TeamWithCount {
  id: string;
  name: string;
  description?: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  created_at: string;
  locations?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  member_count: number;
}

// Helper function to safely cast team member role
function safeCastTeamRole(role: any): 'MEMBER' | 'ADMIN' {
  if (role === 'ADMIN' || role === 'MEMBER') {
    return role;
  }
  return 'MEMBER'; // Default fallback
}

export function TeamManagementHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'metrics'>('table');
  const [managingTeam, setManagingTeam] = useState<EnhancedTeam | null>(null);
  
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams-professional'],
    queryFn: async () => {
      // First get teams with locations
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          team_type,
          performance_score,
          created_at,
          locations(id, name, city, state)
        `)
        .order('created_at', { ascending: false });
      
      if (teamsError) throw teamsError;

      // Then get member counts for each team
      const teamsWithCounts: TeamWithCount[] = [];
      
      for (const team of teamsData || []) {
        const { count, error: countError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);
        
        if (countError) {
          console.error('Error getting member count for team:', team.id, countError);
        }
        
        teamsWithCounts.push({
          ...team,
          member_count: count || 0
        });
      }
      
      return teamsWithCounts;
    }
  });

  const { data: metrics } = useQuery({
    queryKey: ['team-metrics-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('status, performance_score, team_type');
      
      if (error) throw error;
      
      return {
        totalTeams: data.length,
        activeTeams: data.filter(t => t.status === 'active').length,
        averagePerformance: data.reduce((avg, t) => avg + (t.performance_score || 0), 0) / data.length,
        teamTypes: data.reduce((acc, t) => {
          acc[t.team_type || 'standard'] = (acc[t.team_type || 'standard'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  });

  const handleBulkAction = async (action: string, teamIds: string[]) => {
    if (action === 'export') {
      setShowExportDialog(true);
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await supabase.from('teams').update({ status: 'active' }).in('id', teamIds);
          break;
        case 'deactivate':
          await supabase.from('teams').update({ status: 'inactive' }).in('id', teamIds);
          break;
        case 'archive':
          await supabase.from('teams').update({ status: 'archived' }).in('id', teamIds);
          break;
        case 'notify':
          // This would call an edge function to send notifications
          console.log('Sending notifications to teams:', teamIds);
          break;
      }
      
      toast.success(`${action} completed for ${teamIds.length} teams`);
      setSelectedTeams([]);
      queryClient.invalidateQueries({ queryKey: ['teams-professional'] });
    } catch (error) {
      toast.error(`Failed to ${action} teams`);
    }
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleFilter = () => {
    toast.info('Advanced filtering coming soon!');
  };

  const handleManageTeamMembers = async (teamId: string) => {
    try {
      // Fetch detailed team info for management
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          locations(id, name, city, state),
          team_members(
            *,
            profiles(id, display_name, email, role)
          )
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Transform to EnhancedTeam format with proper type safety
      const enhancedTeam: EnhancedTeam = {
        ...teamData,
        location: teamData.locations ? {
          id: teamData.locations.id,
          name: teamData.locations.name,
          city: teamData.locations.city,
          state: teamData.locations.state
        } : undefined,
        members: teamData.team_members?.map(member => ({
          ...member,
          role: safeCastTeamRole(member.role), // Safely cast the team role
          permissions: parseJsonToRecord(member.permissions), // Safely parse permissions
          display_name: member.profiles?.display_name || 'Unknown User',
          profile: member.profiles ? {
            id: member.profiles.id,
            display_name: member.profiles.display_name,
            email: member.profiles.email,
            role: member.profiles.role // This is the user's system role, keep as-is
          } : undefined
        })) || []
      };

      setManagingTeam(enhancedTeam);
    } catch (error) {
      toast.error('Failed to load team details');
      console.error('Error loading team for management:', error);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage teams, members, and performance across your organization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={activeView === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('table')}
          >
            <Users className="h-4 w-4 mr-2" />
            Teams
          </Button>
          <Button
            variant={activeView === 'metrics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('metrics')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Teams</p>
                <p className="text-2xl font-bold text-blue-900">{metrics?.totalTeams || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active Teams</p>
                <p className="text-2xl font-bold text-green-900">{metrics?.activeTeams || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-900">
                  {metrics?.averagePerformance?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Selected</p>
                <p className="text-2xl font-bold text-orange-900">{selectedTeams.length}</p>
              </div>
              <Filter className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {selectedTeams.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedTeams.length} selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel */}
      {selectedTeams.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedTeams.length}
          onBulkAction={handleBulkAction}
          selectedTeams={selectedTeams}
        />
      )}

      {/* Main Content */}
      {activeView === 'table' ? (
        <TeamTable
          teams={filteredTeams}
          selectedTeams={selectedTeams}
          onSelectTeams={setSelectedTeams}
          onManageMembers={handleManageTeamMembers}
          isLoading={isLoading}
        />
      ) : (
        <TeamMetrics teams={teams} />
      )}

      {/* Dialogs */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTeamCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['teams-professional'] });
          setShowCreateDialog(false);
        }}
      />

      <ExportDialog
        teams={teams}
        selectedTeams={selectedTeams}
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      {managingTeam && (
        <TeamMemberManagementDialog
          team={managingTeam}
          open={!!managingTeam}
          onOpenChange={(open) => !open && setManagingTeam(null)}
          onTeamUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['teams-professional'] });
          }}
        />
      )}
    </div>
  );
}
