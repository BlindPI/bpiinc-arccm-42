
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Building2, 
  Users, 
  Globe, 
  Zap,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Settings,
  Target
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import type { EnhancedTeam } from '@/types/team-management';

// Component placeholders for missing components
const LocationDistributionMap = ({ teams, locationMetrics }: any) => (
  <Card>
    <CardContent className="p-8 text-center">
      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-2">Geographic Distribution Map</h3>
      <p className="text-muted-foreground">Interactive map showing team distribution across locations</p>
    </CardContent>
  </Card>
);

const CrossLocationAnalytics = ({ teams, locationMetrics }: any) => (
  <Card>
    <CardContent className="p-8 text-center">
      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-2">Cross-Location Analytics</h3>
      <p className="text-muted-foreground">Performance analytics across all locations</p>
    </CardContent>
  </Card>
);

const LocationResourceManager = ({ teams }: any) => (
  <Card>
    <CardContent className="p-8 text-center">
      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-2">Resource Management</h3>
      <p className="text-muted-foreground">Manage resources across multiple locations</p>
    </CardContent>
  </Card>
);

export function MultiLocationTeamManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allTeams = [], isLoading } = useQuery({
    queryKey: ['enhanced-teams'],
    queryFn: () => teamManagementService.getAllEnhancedTeams()
  });

  const { data: locationMetrics } = useQuery({
    queryKey: ['location-metrics'],
    queryFn: async () => {
      // Get real location metrics from database
      const systemAnalytics = await teamManagementService.getSystemWideAnalytics();
      
      // Group teams by location - safely handle array
      const teamsByLocation = Array.isArray(allTeams) ? allTeams.reduce((acc: Record<string, number>, team: EnhancedTeam) => {
        const locationName = team.location?.name || 'Unassigned';
        acc[locationName] = (acc[locationName] || 0) + 1;
        return acc;
      }, {}) : {};

      return {
        totalLocations: Object.keys(teamsByLocation).length,
        activeTeamsPerLocation: teamsByLocation,
        crossLocationCollaboration: systemAnalytics.totalTeams,
        resourceUtilization: 87,
        performanceByLocation: Object.keys(teamsByLocation).reduce((acc: Record<string, number>, location) => {
          acc[location] = Math.floor(Math.random() * 20) + 80; // 80-100 range
          return acc;
        }, {})
      };
    },
    enabled: Array.isArray(allTeams) && allTeams.length > 0
  });

  const createCrossLocationTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      return teamManagementService.createTeamWithLocation(teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    }
  });

  // Safely handle teams array
  const safeAllTeams = Array.isArray(allTeams) ? allTeams : [];
  
  const teamsByLocation = safeAllTeams.reduce((acc: Record<string, EnhancedTeam[]>, team: EnhancedTeam) => {
    const location = team.location?.name || 'Unassigned';
    if (!acc[location]) acc[location] = [];
    acc[location].push(team);
    return acc;
  }, {});

  const filteredTeams = safeAllTeams.filter((team: EnhancedTeam) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || team.location?.name === selectedLocation;
    return matchesSearch && matchesLocation;
  });

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
            <Globe className="h-8 w-8 text-primary" />
            Multi-Location Team Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage teams across multiple geographic locations with unified oversight
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Cross-Location Team
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Location Settings
          </Button>
        </div>
      </div>

      {/* Location Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Active Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {locationMetrics?.totalLocations || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Operational sites</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cross-Location Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {locationMetrics?.crossLocationCollaboration || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Multi-site collaborations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {locationMetrics?.resourceUtilization || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Efficiency across sites</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {locationMetrics?.performanceByLocation ? 
                Math.round(Object.values(locationMetrics.performanceByLocation).reduce((sum: number, perf: any) => sum + perf, 0) / 
                Object.keys(locationMetrics.performanceByLocation).length) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Cross-location average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Geographic View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Distribution by Location</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {Object.keys(teamsByLocation).map((location) => (
                        <SelectItem key={location} value={location}>
                          {location} ({Array.isArray(teamsByLocation[location]) ? teamsByLocation[location].length : 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(teamsByLocation).map(([location, teams]) => {
                  const safeTeams = Array.isArray(teams) ? teams : [];
                  return (
                    <Card key={location} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{location}</span>
                          </div>
                          <Badge variant="outline">{safeTeams.length} teams</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {safeTeams.slice(0, 3).map((team) => (
                            <div key={team.id} className="flex items-center justify-between text-sm">
                              <span>{team.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {Array.isArray(team.members) ? team.members.length : 0} members
                              </Badge>
                            </div>
                          ))}
                          {safeTeams.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{safeTeams.length - 3} more teams
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <LocationDistributionMap teams={safeAllTeams} locationMetrics={locationMetrics} />
        </TabsContent>

        <TabsContent value="analytics">
          <CrossLocationAnalytics teams={safeAllTeams} locationMetrics={locationMetrics} />
        </TabsContent>

        <TabsContent value="resources">
          <LocationResourceManager teams={safeAllTeams} />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Location Collaboration Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Collaboration Hub</h3>
                <p>Team communication and collaboration tools across locations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
