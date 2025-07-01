
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Shield, 
  BarChart3, 
  Settings, 
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Crown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { EnterpriseTeamAdminDashboard } from '@/components/admin/enterprise/EnterpriseTeamAdminDashboard';

export function TeamAdministrationDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeView, setActiveView] = useState('enterprise');

  // Get all teams for administration
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => teamManagementService.getEnhancedTeams()
  });

  // Get team statistics
  const teamStats = {
    totalTeams: allTeams.length,
    activeTeams: allTeams.filter(t => t.status === 'active').length,
    inactiveTeams: allTeams.filter(t => t.status === 'inactive').length,
    suspendedTeams: allTeams.filter(t => t.status === 'suspended').length,
    totalMembers: allTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0),
    avgPerformance: allTeams.length > 0 
      ? Math.round(allTeams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / allTeams.length)
      : 0
  };

  const filteredTeams = allTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.location?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || team.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use Enterprise Dashboard for Phase 4
  if (activeView === 'enterprise') {
    return <EnterpriseTeamAdminDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Team Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive system-wide team management and oversight
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant={activeView === 'enterprise' ? 'default' : 'outline'}
            onClick={() => setActiveView('enterprise')}
          >
            <Crown className="h-4 w-4 mr-2" />
            Enterprise View
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Teams
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamStats.totalTeams}</div>
            <p className="text-xs text-gray-500 mt-1">{teamStats.activeTeams} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">Across all teams</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamStats.avgPerformance}%</div>
            <p className="text-xs text-gray-500 mt-1">System-wide average</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teamStats.suspendedTeams}</div>
            <p className="text-xs text-gray-500 mt-1">Teams suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Administration Tabs */}
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">Teams Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Management
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="text-center py-8">Loading teams...</div>
              ) : (
                <div className="space-y-4">
                  {filteredTeams.map((team) => (
                    <Card key={team.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge className={getStatusColor(team.status)}>
                                {getStatusIcon(team.status)}
                                <span className="ml-1">{team.status}</span>
                              </Badge>
                              <Badge variant="outline">
                                {team.team_type}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <div className="font-medium">{team.location?.name || 'No Location'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Members:</span>
                                <div className="font-medium">{team.members?.length || 0}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Performance:</span>
                                <div className="font-medium">{team.performance_score}%</div>
                              </div>
                            </div>
                            
                            {team.description && (
                              <p className="text-gray-600 mt-2">{team.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Member Management</h3>
                <p>Cross-team member management and bulk operations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Team Analytics</h3>
                <p>Comprehensive analytics across all teams and locations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">System Configuration</h3>
                <p>Global team management settings and policies</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
