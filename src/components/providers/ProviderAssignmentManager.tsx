/**
 * PROVIDER ASSIGNMENT MANAGER
 * 
 * Comprehensive interface that provides clear visibility and control over:
 * - All Authorized Provider users
 * - Their assigned locations  
 * - Their assigned teams
 * - Controls to change location and team assignments
 * 
 * This addresses the UI/UX disconnect by providing a unified management view.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MapPin, 
  Building, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Settings,
  BarChart3,
  Crown,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface ProviderWithAssignments {
  id: string;
  name: string;
  provider_type: string;
  status: string;
  contact_email?: string;
  contact_phone?: string;
  primary_location_id?: string;
  primary_location_name?: string;
  location_assignments: LocationAssignment[];
  team_assignments: TeamAssignment[];
  performance_rating: number;
  compliance_score: number;
  created_at: string;
}

interface LocationAssignment {
  id: string;
  location_id: string;
  location_name: string;
  assignment_role: string;
  status: string;
  start_date: string;
  end_date?: string;
}

interface TeamAssignment {
  id: string;
  team_id: string;
  team_name: string;
  location_name: string;
  assignment_role: string;
  oversight_level: string;
  assignment_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  member_count: number;
  performance_score: number;
}

interface AvailableLocation {
  id: string;
  name: string;
  address?: string;
  location_type?: string;
}

interface AvailableTeam {
  id: string;
  name: string;
  team_type: string;
  location_name: string;
  member_count: number;
  status: string;
}

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================

export const ProviderAssignmentManager: React.FC = () => {
  // =====================================================================================
  // STATE MANAGEMENT
  // =====================================================================================
  
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentData, setAssignmentData] = useState({
    location_id: '',
    team_id: '',
    assignment_role: 'primary',
    oversight_level: 'standard',
    assignment_type: 'ongoing',
    start_date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  // =====================================================================================
  // DATA LOADING
  // =====================================================================================

  /**
   * Load all providers with their assignments
   */
  const { 
    data: providersWithAssignments, 
    isLoading: providersLoading, 
    error: providersError,
    refetch: refetchProviders 
  } = useQuery({
    queryKey: ['providers-with-assignments'],
    queryFn: async (): Promise<ProviderWithAssignments[]> => {
      console.log('🔍 Loading all providers with assignments...');
      
      // Get all providers
      const providers = await providerRelationshipService.getProviders({
        status: statusFilter === 'all' ? undefined : [statusFilter]
      });
      
      // For each provider, get their location and team assignments
      const providersWithAssignments = await Promise.all(
        providers.map(async (provider) => {
          // Get primary location name if exists
          let primaryLocationName = 'No Primary Location';
          if (provider.primary_location_id) {
            try {
              const { data: locationData } = await supabase
                .from('locations')
                .select('name')
                .eq('id', provider.primary_location_id)
                .single();
              
              if (locationData) {
                primaryLocationName = locationData.name;
              }
            } catch (error) {
              console.error('Error fetching primary location:', error);
            }
          }

          // Get location assignments (placeholder - would need actual table)
          const locationAssignments: LocationAssignment[] = [];
          
          // Get team assignments
          const teamAssignments = await providerRelationshipService.getProviderTeamAssignments(provider.id);
          
          const mappedTeamAssignments: TeamAssignment[] = teamAssignments.map(assignment => ({
            id: assignment.id,
            team_id: assignment.team_id,
            team_name: assignment.team_name,
            location_name: assignment.location_name,
            assignment_role: assignment.assignment_role,
            oversight_level: assignment.oversight_level,
            assignment_type: assignment.assignment_type,
            status: assignment.status,
            start_date: assignment.start_date,
            end_date: assignment.end_date || undefined,
            member_count: assignment.member_count,
            performance_score: assignment.performance_score
          }));

          return {
            id: provider.id,
            name: provider.name,
            provider_type: provider.provider_type,
            status: provider.status,
            contact_email: provider.contact_email,
            contact_phone: provider.contact_phone,
            primary_location_id: provider.primary_location_id,
            primary_location_name: primaryLocationName,
            location_assignments: locationAssignments,
            team_assignments: mappedTeamAssignments,
            performance_rating: provider.performance_rating || 0,
            compliance_score: provider.compliance_score || 0,
            created_at: provider.created_at
          };
        })
      );
      
      console.log(`✅ Loaded ${providersWithAssignments.length} providers with assignments`);
      return providersWithAssignments;
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  /**
   * Load available locations for assignment
   */
  const { data: availableLocations } = useQuery({
    queryKey: ['available-locations'],
    queryFn: async (): Promise<AvailableLocation[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(location => ({
        id: location.id,
        name: location.name,
        address: undefined,
        location_type: undefined
      }));
    },
    enabled: showLocationDialog
  });

  /**
   * Load available teams for assignment
   */
  const { data: availableTeams } = useQuery({
    queryKey: ['available-teams', selectedProvider],
    queryFn: async (): Promise<AvailableTeam[]> => {
      if (!selectedProvider) return [];
      
      const teams = await providerRelationshipService.getAvailableTeams(selectedProvider);
      
      return teams.map(team => ({
        id: team.id,
        name: team.name,
        team_type: team.team_type,
        location_name: team.location?.name || 'Unknown Location',
        member_count: team.members?.length || 0,
        status: team.status
      }));
    },
    enabled: showTeamDialog && !!selectedProvider
  });

  // =====================================================================================
  // MUTATIONS
  // =====================================================================================

  /**
   * Assign provider to team
   */
  const assignToTeamMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProvider || !assignmentData.team_id) {
        throw new Error('Provider and team must be selected');
      }
      
      return await providerRelationshipService.assignProviderToTeam({
        provider_id: selectedProvider,
        team_id: assignmentData.team_id,
        assignment_role: assignmentData.assignment_role as any,
        oversight_level: assignmentData.oversight_level as any,
        assignment_type: assignmentData.assignment_type as any,
        end_date: undefined
      });
    },
    onSuccess: () => {
      toast.success('Team assignment created successfully');
      setShowTeamDialog(false);
      setSelectedProvider(null);
      setAssignmentData({
        location_id: '',
        team_id: '',
        assignment_role: 'primary',
        oversight_level: 'standard',
        assignment_type: 'ongoing',
        start_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ['providers-with-assignments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create assignment: ${error.message}`);
    }
  });

  /**
   * Remove provider from team
   */
  const removeFromTeamMutation = useMutation({
    mutationFn: async ({ providerId, teamId }: { providerId: string; teamId: string }) => {
      return await providerRelationshipService.removeProviderFromTeam(providerId, teamId);
    },
    onSuccess: () => {
      toast.success('Provider removed from team');
      queryClient.invalidateQueries({ queryKey: ['providers-with-assignments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove from team: ${error.message}`);
    }
  });

  // =====================================================================================
  // COMPUTED VALUES
  // =====================================================================================

  const filteredProviders = useMemo(() => {
    if (!providersWithAssignments) return [];
    
    return providersWithAssignments.filter(provider => {
      const matchesSearch = searchTerm === '' || 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [providersWithAssignments, searchTerm, statusFilter]);

  const assignmentStats = useMemo(() => {
    if (!providersWithAssignments) return { totalProviders: 0, withTeams: 0, withoutTeams: 0, avgTeamsPerProvider: 0 };
    
    const totalProviders = providersWithAssignments.length;
    const withTeams = providersWithAssignments.filter(p => p.team_assignments.length > 0).length;
    const withoutTeams = totalProviders - withTeams;
    const totalTeamAssignments = providersWithAssignments.reduce((sum, p) => sum + p.team_assignments.length, 0);
    const avgTeamsPerProvider = totalProviders > 0 ? totalTeamAssignments / totalProviders : 0;
    
    return { totalProviders, withTeams, withoutTeams, avgTeamsPerProvider };
  }, [providersWithAssignments]);

  // =====================================================================================
  // EVENT HANDLERS
  // =====================================================================================

  const handleAssignToTeam = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowTeamDialog(true);
  };

  const handleAssignToLocation = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowLocationDialog(true);
  };

  const handleRemoveFromTeam = async (providerId: string, teamId: string) => {
    if (confirm('Are you sure you want to remove this team assignment?')) {
      await removeFromTeamMutation.mutateAsync({ providerId, teamId });
    }
  };

  const handleRefresh = async () => {
    await refetchProviders();
    toast.success('Provider assignments refreshed');
  };

  // =====================================================================================
  // RENDER
  // =====================================================================================

  if (providersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (providersError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load provider assignments. Please try refreshing.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Provider Assignment Manager
          </CardTitle>
          <CardDescription>
            Comprehensive management of Authorized Provider users, their location assignments, and team assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total AP Users</p>
                  <p className="text-2xl font-bold text-blue-700">{assignmentStats.totalProviders}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">With Team Assignments</p>
                  <p className="text-2xl font-bold text-green-700">{assignmentStats.withTeams}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Without Team Assignments</p>
                  <p className="text-2xl font-bold text-orange-700">{assignmentStats.withoutTeams}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Avg Teams per Provider</p>
                  <p className="text-2xl font-bold text-purple-700">{assignmentStats.avgTeamsPerProvider.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search providers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider List with Assignments */}
      <div className="space-y-4">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                          {provider.status}
                        </Badge>
                        <span>•</span>
                        <span>{provider.provider_type}</span>
                        {provider.contact_email && (
                          <>
                            <span>•</span>
                            <span>{provider.contact_email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div>Performance: {provider.performance_rating}/100</div>
                      <div>Compliance: {provider.compliance_score}/100</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Assignments Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Location Assignments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Assignments
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAssignToLocation(provider.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign Location
                      </Button>
                    </div>
                    
                    {/* Primary Location */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Primary Location</div>
                          <div className="text-sm text-muted-foreground">{provider.primary_location_name}</div>
                        </div>
                        <Badge variant="outline">Primary</Badge>
                      </div>
                    </div>

                    {/* Additional Location Assignments */}
                    {provider.location_assignments.length > 0 ? (
                      provider.location_assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{assignment.location_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.assignment_role} • Since {new Date(assignment.start_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {assignment.status}
                              </Badge>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No additional location assignments
                      </div>
                    )}
                  </div>

                  {/* Team Assignments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Team Assignments ({provider.team_assignments.length})
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAssignToTeam(provider.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign Team
                      </Button>
                    </div>
                    
                    {provider.team_assignments.length > 0 ? (
                      provider.team_assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{assignment.team_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.location_name} • {assignment.member_count} members
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {assignment.assignment_role}
                                </Badge>
                                <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {assignment.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleRemoveFromTeam(provider.id, assignment.team_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No team assignments</p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleAssignToTeam(provider.id)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign First Team
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No providers found matching your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Team Assignment Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Provider to Team</DialogTitle>
            <DialogDescription>
              Select a team and configure the assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-select">Select Team</Label>
              <Select value={assignmentData.team_id} onValueChange={(value) => setAssignmentData({...assignmentData, team_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams?.length ? (
                    availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {team.location_name} ({team.member_count} members)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-teams" disabled>No available teams found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignment-role">Assignment Role</Label>
                <Select value={assignmentData.assignment_role} onValueChange={(value) => setAssignmentData({...assignmentData, assignment_role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Provider</SelectItem>
                    <SelectItem value="secondary">Secondary Provider</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="oversight-level">Oversight Level</Label>
                <Select value={assignmentData.oversight_level} onValueChange={(value) => setAssignmentData({...assignmentData, oversight_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="manage">Manage</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTeamDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => assignToTeamMutation.mutate()}
                disabled={assignToTeamMutation.isPending || !assignmentData.team_id}
              >
                {assignToTeamMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Create Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Assignment Dialog (Placeholder) */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Provider to Location</DialogTitle>
            <DialogDescription>
              Location assignment functionality coming soon
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Location assignment interface will be implemented based on your requirements</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderAssignmentManager;