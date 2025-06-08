
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService, type EnhancedTeam, type TeamAnalytics } from '@/services/team/teamManagementService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Plus,
  Search,
  Filter,
  BarChart3,
  Settings,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedTeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<EnhancedTeam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  // Fetch enhanced teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => teamManagementService.getAllEnhancedTeams()
  });

  // Fetch locations for filtering
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch providers for filtering
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('authorized_providers').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch system analytics
  const { data: analytics } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => teamManagementService.getSystemWideAnalytics()
  });

  // Filter teams based on search and filters
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || team.location_id === filterLocation;
    const matchesProvider = filterProvider === 'all' || team.provider_id === filterProvider;
    
    return matchesSearch && matchesLocation && matchesProvider;
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: any) => teamManagementService.createTeam(teamData),
    onSuccess: () => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  if (teamsLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Enterprise-grade team operations, analytics, and cross-location management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics Dashboard
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.totalTeams}</div>
              <p className="text-xs text-gray-500 mt-1">Active across all locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.totalMembers}</div>
              <p className="text-xs text-gray-500 mt-1">Team participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analytics.averagePerformance.toFixed(1)}</div>
              <p className="text-xs text-gray-500 mt-1">Performance score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{analytics.averageCompliance.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">Compliance rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Teams List with Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams ({filteredTeams.length})
            </CardTitle>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{team.name}</h4>
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{team.team_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {team.location?.name || 'No location'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{team.members?.length || 0} members</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Score: {team.performance_score}/100</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTeams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teams found</p>
                <p className="text-sm">Adjust your filters or create a new team</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card className="lg:col-span-3">
          {selectedTeam ? (
            <Tabs defaultValue="overview">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTeam.name}
                      <Badge variant={selectedTeam.status === 'active' ? 'default' : 'secondary'}>
                        {selectedTeam.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTeam.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="p-6">
                <TabsContent value="overview">
                  <div className="space-y-6">
                    {/* Team Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Team Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{selectedTeam.team_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{selectedTeam.location?.name || 'Not assigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider:</span>
                            <span>{selectedTeam.provider?.name || 'Not assigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Members:</span>
                            <span>{selectedTeam.members?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Performance Score:</span>
                            <span>{selectedTeam.performance_score}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={selectedTeam.status === 'active' ? 'default' : 'secondary'}>
                              {selectedTeam.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="members">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Team members management</p>
                    <p className="text-sm">Member list and role management interface</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="performance">
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance analytics</p>
                    <p className="text-sm">Detailed performance metrics and trends</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="assignments">
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Location and provider assignments</p>
                    <p className="text-sm">Manage team location and provider relationships</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Team</h3>
              <p className="text-muted-foreground">
                Choose a team from the list to view detailed information, manage members, and track performance metrics.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
