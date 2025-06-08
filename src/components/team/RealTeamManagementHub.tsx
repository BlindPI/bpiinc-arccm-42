
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  Search,
  Plus,
  Filter,
  Download,
  MapPin,
  TrendingUp,
  Eye,
  UserCog
} from 'lucide-react';
import { RealTeamService, type RealTeam } from '@/services/team/realTeamService';
import { useUserRole } from '@/hooks/useUserRole';
import { CreateTeamModal } from './modals/CreateTeamModal';
import { ManageMembersModal } from './modals/ManageMembersModal';

export function RealTeamManagementHub() {
  const { role, permissions } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<RealTeam | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Fetch teams using real database function
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => RealTeamService.getEnhancedTeams(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch analytics using real database function
  const { data: analytics } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => RealTeamService.getTeamAnalytics(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'provider_team': return 'bg-blue-100 text-blue-800';
      case 'training_team': return 'bg-purple-100 text-purple-800';
      case 'operations': return 'bg-orange-100 text-orange-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Teams</h2>
          <p className="text-muted-foreground">
            There was an issue loading the team data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage teams with real database integration and role-based access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Badge variant="outline">{role}</Badge>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        {permissions.canManageTeams && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Teams</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics?.totalTeams || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics?.totalMembers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Performance</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Math.round(analytics?.averagePerformance || 0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Compliance</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Math.round(analytics?.averageCompliance || 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(team.status)}>
                  {team.status}
                </Badge>
                <Badge className={getTypeColor(team.team_type)}>
                  {team.team_type?.replace('_', ' ') || 'Standard'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Team Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{team.member_count} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{team.performance_score || 0}% score</span>
                  </div>
                </div>

                {/* Location */}
                {team.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{team.location.name}</span>
                  </div>
                )}

                {/* Provider */}
                {team.provider && (
                  <div className="text-sm text-muted-foreground">
                    Provider: {team.provider.name}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(team.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {permissions.canManageMembers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowMembersModal(true);
                        }}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No teams found matching your search' : 'No teams available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {/* Manage Members Modal */}
      {selectedTeam && (
        <ManageMembersModal
          team={selectedTeam}
          open={showMembersModal}
          onOpenChange={(open) => {
            setShowMembersModal(open);
            if (!open) setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
}
