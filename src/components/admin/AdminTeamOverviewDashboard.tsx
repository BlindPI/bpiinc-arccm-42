import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useAdminTeamData, useAdminTeamStatistics } from '@/hooks/useAdminTeamContext';
import type { GlobalTeamData } from '@/hooks/useAdminTeamContext';
import { AdminTeamCRUDInterface } from './AdminTeamCRUDInterface';
import { TeamKPIDashboard } from './TeamKPIDashboard';

interface TeamCardProps {
  team: GlobalTeamData;
  onEdit: (team: GlobalTeamData) => void;
  onDelete: (team: GlobalTeamData) => void;
  onManageMembers: (team: GlobalTeamData) => void;
  onViewAnalytics: (team: GlobalTeamData) => void;
}

function TeamCard({ team, onEdit, onDelete, onManageMembers, onViewAnalytics }: TeamCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4" />;
      case 'suspended': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {team.description || 'No description provided'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(team.status)} flex items-center gap-1`}>
              {getStatusIcon(team.status)}
              {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Team Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Members</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-semibold">{team.member_count}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Performance</p>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className={`text-lg font-semibold ${getPerformanceColor(team.performance_score)}`}>
                {team.performance_score}%
              </span>
            </div>
          </div>
        </div>

        {/* Team Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline">{team.team_type}</Badge>
          </div>
          
          {team.location && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-muted-foreground">Location:</span>
              <span>{team.location.name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(team)}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageMembers(team)}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-3 w-3" />
              Members
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAnalytics(team)}
              className="flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              Analytics
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(team)}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatisticCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function StatisticCard({ title, value, change, icon, color }: StatisticCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminTeamOverviewDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<GlobalTeamData | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useAdminTeamData();
  const { data: statistics, isLoading: statsLoading } = useAdminTeamStatistics();

  // Filter teams based on search and filters
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    const matchesType = typeFilter === 'all' || team.team_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique team types for filter
  const teamTypes = Array.from(new Set(teams.map(team => team.team_type)));

  const handleEditTeam = (team: GlobalTeamData) => {
    // This will be handled by the CRUD interface
    console.log('Edit team:', team.id);
  };

  const handleDeleteTeam = (team: GlobalTeamData) => {
    // This will be handled by the CRUD interface
    console.log('Delete team:', team.id);
  };

  const handleManageMembers = (team: GlobalTeamData) => {
    setSelectedTeam(team);
    setMemberDialogOpen(true);
  };

  const handleViewAnalytics = (team: GlobalTeamData) => {
    setSelectedTeam(team);
    setAnalyticsDialogOpen(true);
  };

  if (teamsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (teamsError) {
    console.error('🔧 ADMIN-DASHBOARD: Teams error detected:', teamsError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <div>
            <p className="text-red-600 font-medium">Failed to load team data</p>
            <p className="text-sm text-muted-foreground mt-1">
              Database function issue detected. Using Enterprise Teams as fallback.
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/enhanced-teams'}
            className="mt-4"
          >
            Switch to Enterprise Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Administrative Team Management
          </h1>
          <p className="text-muted-foreground">
            Global team management and oversight for system administrators
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatisticCard
            title="Total Teams"
            value={statistics.totalTeams}
            icon={<Building2 className="h-6 w-6 text-white" />}
            color="bg-blue-500"
          />
          
          <StatisticCard
            title="Total Members"
            value={statistics.totalMembers}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-green-500"
          />
          
          <StatisticCard
            title="Avg Performance"
            value={`${statistics.averagePerformance}%`}
            icon={<BarChart3 className="h-6 w-6 text-white" />}
            color="bg-purple-500"
          />
          
          <StatisticCard
            title="Active Teams"
            value={statistics.activeTeams}
            icon={<CheckCircle className="h-6 w-6 text-white" />}
            color="bg-emerald-500"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            KPI Analytics
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Team Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teams by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {teamTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDelete={handleDeleteTeam}
                onManageMembers={handleManageMembers}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredTeams.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No teams found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Get started by creating your first team.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <TeamKPIDashboard />
        </TabsContent>

        <TabsContent value="management">
          <AdminTeamCRUDInterface />
        </TabsContent>
      </Tabs>

      {/* Member Management Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage Members - {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-muted-foreground">
              Member management interface will be implemented in Phase 2.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Team Analytics - {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-muted-foreground">
              Team analytics interface will be implemented in Phase 2.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}