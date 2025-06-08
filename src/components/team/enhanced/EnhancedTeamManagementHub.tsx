
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Plus, 
  Settings, 
  BarChart3,
  MapPin,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { teamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { TeamComplianceMonitor } from '@/components/admin/enterprise/TeamComplianceMonitor';
import { CrossTeamAnalytics } from '@/components/admin/enterprise/CrossTeamAnalytics';

export function EnhancedTeamManagementHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: enhancedTeams = [], isLoading } = useQuery({
    queryKey: ['enhanced-teams-hub'],
    queryFn: () => teamManagementService.getEnhancedTeams()
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: () => teamAnalyticsService.getSystemWideAnalytics()
  });

  const filteredTeams = enhancedTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.location?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4" />;
      case 'suspended': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Calculate real-time metrics
  const totalLocations = new Set(enhancedTeams.map(t => t.location?.id).filter(Boolean)).size;
  const averagePerformance = enhancedTeams.length > 0 
    ? Math.round(enhancedTeams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / enhancedTeams.length)
    : 0;
  const totalMembers = enhancedTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Enhanced Team Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced team oversight and management capabilities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enhancedTeams.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {enhancedTeams.filter(t => t.status === 'active').length} active
            </p>
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
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-gray-500 mt-1">Unique locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerformance}%</div>
            <p className="text-xs text-gray-500 mt-1">Team performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Team List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Enhanced Team Overview</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTeams.map((team) => (
                  <div key={team.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge className={getStatusColor(team.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(team.status)}
                              {team.status}
                            </span>
                          </Badge>
                          <Badge variant="outline">
                            {team.team_type}
                          </Badge>
                          {team.performance_score >= 90 && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Top Performer
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <div className="font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {team.location?.name || 'No Location'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Members:</span>
                            <div className="font-medium flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {team.members?.length || 0}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Performance:</span>
                            <div className="font-medium flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${team.performance_score || 0}%` }}
                                ></div>
                              </div>
                              <span>{team.performance_score || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <div className="font-medium">{new Date(team.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {team.description && (
                          <p className="text-sm text-gray-600 mt-2">{team.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTeams.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
                    <p>
                      {searchTerm 
                        ? 'No teams match your search criteria.' 
                        : 'No teams have been created yet.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <CrossTeamAnalytics />
        </TabsContent>

        <TabsContent value="compliance">
          <TeamComplianceMonitor />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {enhancedTeams.filter(t => t.performance_score >= 90).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">High Performers (90%+)</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {enhancedTeams.filter(t => t.performance_score >= 70 && t.performance_score < 90).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Good Performers (70-89%)</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {enhancedTeams.filter(t => t.performance_score < 70).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Needs Improvement (<70%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
