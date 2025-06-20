import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedAPTeamService, type APUserDashboard as DashboardData } from '@/services/unified/UnifiedAPTeamService';
import {
  MapPin,
  Users,
  Plus,
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  Building2,
  UserPlus,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface APUserDashboardProps {
  apUserId: string;
}

export function APUserDashboard({ apUserId }: APUserDashboardProps) {
  const queryClient = useQueryClient();
  const [selectedTeamType, setSelectedTeamType] = useState<'general' | 'sales' | 'support' | 'retention'>('general');
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  // Get dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['ap-user-dashboard', apUserId],
    queryFn: () => UnifiedAPTeamService.getAPUserDashboard(apUserId),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: {
      name: string;
      description?: string;
      locationId: string;
      teamType: 'general' | 'sales' | 'support' | 'retention';
    }) => {
      return UnifiedAPTeamService.createTeam({
        ...teamData,
        assignedAPUserId: apUserId
      });
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      setIsCreateTeamOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ap-user-dashboard', apUserId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <Target className="h-4 w-4" />;
      case 'support': return <Users className="h-4 w-4" />;
      case 'retention': return <TrendingUp className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      case 'retention': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {dashboardData.displayName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {dashboardData.locations.length} Location{dashboardData.locations.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {dashboardData.totalMembers} Team Members
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Assigned Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardData.locations.length}</div>
            <p className="text-sm text-gray-500 mt-1">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Teams Managed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboardData.totalTeams}</div>
            <p className="text-sm text-gray-500 mt-1">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{dashboardData.totalMembers}</div>
            <p className="text-sm text-gray-500 mt-1">Total under management</p>
          </CardContent>
        </Card>
      </div>

      {/* Locations and Teams */}
      <Tabs defaultValue="locations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="locations">My Locations</TabsTrigger>
          <TabsTrigger value="teams">All Teams</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-6">
          {dashboardData.locations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Assignments</h3>
                <p className="text-gray-500 mb-4">
                  You haven't been assigned to any locations yet. Contact your administrator to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {dashboardData.locations.map((location) => (
                <Card key={location.locationId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {location.locationName}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Assigned {new Date(location.assignmentDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Team</DialogTitle>
                          </DialogHeader>
                          <CreateTeamForm
                            locationId={location.locationId}
                            locationName={location.locationName}
                            onSubmit={(data) => createTeamMutation.mutate(data)}
                            isLoading={createTeamMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{location.teamCount}</div>
                        <div className="text-sm text-blue-600">Teams</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{location.memberCount}</div>
                        <div className="text-sm text-green-600">Members</div>
                      </div>
                    </div>

                    {location.teams.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Teams at this location:</h4>
                        <div className="grid gap-2">
                          {location.teams.map((team) => (
                            <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {getTeamTypeIcon(team.teamType)}
                                <div>
                                  <div className="font-medium">{team.name}</div>
                                  {team.description && (
                                    <div className="text-sm text-gray-500">{team.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getTeamTypeColor(team.teamType)}>
                                  {team.teamType}
                                </Badge>
                                <Badge variant="outline">
                                  {team.memberCount} members
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams">
          <AllTeamsView dashboardData={dashboardData} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsView dashboardData={dashboardData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Team Form Component
interface CreateTeamFormProps {
  locationId: string;
  locationName: string;
  onSubmit: (data: {
    name: string;
    description?: string;
    locationId: string;
    teamType: 'general' | 'sales' | 'support' | 'retention';
  }) => void;
  isLoading: boolean;
}

function CreateTeamForm({ locationId, locationName, onSubmit, isLoading }: CreateTeamFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamType: 'general' as 'general' | 'sales' | 'support' | 'retention'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      locationId,
      description: formData.description || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={locationName} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter team name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-type">Team Type</Label>
        <Select value={formData.teamType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, teamType: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select team type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Team</SelectItem>
            <SelectItem value="sales">Sales Team</SelectItem>
            <SelectItem value="support">Customer Support</SelectItem>
            <SelectItem value="retention">Customer Retention</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-description">Description (Optional)</Label>
        <Textarea
          id="team-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the team's purpose and goals"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}

// All Teams View Component
function AllTeamsView({ dashboardData }: { dashboardData: DashboardData }) {
  const allTeams = dashboardData.locations.flatMap(loc => loc.teams);
  
  if (allTeams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
          <p className="text-gray-500">
            Create your first team to start managing members and tracking performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  const teamsByType = allTeams.reduce((acc, team) => {
    if (!acc[team.teamType]) acc[team.teamType] = [];
    acc[team.teamType].push(team);
    return acc;
  }, {} as Record<string, typeof allTeams>);

  return (
    <div className="space-y-6">
      {Object.entries(teamsByType).map(([type, teams]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              {type === 'sales' && <Target className="h-5 w-5" />}
              {type === 'support' && <Users className="h-5 w-5" />}
              {type === 'retention' && <TrendingUp className="h-5 w-5" />}
              {type === 'general' && <Building2 className="h-5 w-5" />}
              {type} Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-gray-500">{team.locationName}</p>
                    {team.description && (
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{team.memberCount} members</div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Metrics View Component
function MetricsView({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.totalTeams}</div>
              <div className="text-sm text-blue-600 mt-1">Total Teams</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{dashboardData.totalMembers}</div>
              <div className="text-sm text-green-600 mt-1">Total Members</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {dashboardData.totalTeams > 0 ? Math.round(dashboardData.totalMembers / dashboardData.totalTeams) : 0}
              </div>
              <div className="text-sm text-purple-600 mt-1">Avg Team Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.locations.map((location) => (
              <div key={location.locationId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{location.locationName}</div>
                  <div className="text-sm text-gray-500">
                    {location.teamCount} teams, {location.memberCount} members
                  </div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${dashboardData.totalMembers > 0 ? (location.memberCount / dashboardData.totalMembers) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}