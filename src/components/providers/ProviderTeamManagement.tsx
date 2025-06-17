import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedProviderService } from '@/services/provider/unifiedProviderService';
import type { ProviderTeamAssignment, AssignProviderToTeamRequest, TeamFilters } from '@/types/provider-management';
import { 
  Users, 
  Plus, 
  Building2, 
  MapPin, 
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Settings,
  Eye,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProviderTeamManagementProps {
  providerId: string;
  providerName: string;
}

export function ProviderTeamManagement({ providerId, providerName }: ProviderTeamManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<ProviderTeamAssignment | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Assignment form state
  const [selectedTeam, setSelectedTeam] = useState('');
  const [assignmentRole, setAssignmentRole] = useState<'primary' | 'secondary' | 'supervisor' | 'coordinator'>('primary');
  const [oversightLevel, setOversightLevel] = useState<'monitor' | 'standard' | 'manage' | 'admin'>('standard');
  const [assignmentType, setAssignmentType] = useState<'ongoing' | 'project_based' | 'temporary'>('ongoing');
  const [endDate, setEndDate] = useState('');

  // Fetch provider team assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['provider-team-assignments', providerId],
    queryFn: () => UnifiedProviderService.getProviderAssignments(providerId)
  });

  // Fetch available teams for assignment
  const { data: teamsResponse } = useQuery({
    queryKey: ['available-teams', providerId],
    queryFn: () => UnifiedProviderService.getTeams()
  });

  // Fetch provider analytics
  const { data: analyticsResponse } = useQuery({
    queryKey: ['provider-team-analytics', providerId],
    queryFn: () => UnifiedProviderService.getProviderAnalytics(providerId)
  });

  // Extract data from responses
  const availableTeams = Array.isArray(teamsResponse) ? teamsResponse : teamsResponse?.data || [];
  const analytics = analyticsResponse?.data;

  // Assign provider to team mutation
  const assignTeamMutation = useMutation({
    mutationFn: () => UnifiedProviderService.assignProviderToTeam({
      provider_id: providerId,
      team_id: selectedTeam,
      assignment_role: assignmentRole,
      oversight_level: oversightLevel,
      assignment_type: assignmentType,
      end_date: endDate || undefined
    }),
    onSuccess: () => {
      toast.success('Provider assigned to team successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-teams', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-team-analytics', providerId] });
      setShowAssignDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to assign provider to team: ${error.message}`);
    }
  });

  // Remove assignment mutation - Note: This would need a remove method in UnifiedProviderService
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignment: ProviderTeamAssignment) => {
      // For now, we'll show a message that this feature needs implementation
      throw new Error('Remove assignment feature needs to be implemented in UnifiedProviderService');
    },
    onSuccess: () => {
      toast.success('Provider removed from team successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-teams', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-team-analytics', providerId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove provider from team: ${error.message}`);
    }
  });

  const resetForm = () => {
    setSelectedTeam('');
    setAssignmentRole('primary');
    setOversightLevel('standard');
    setAssignmentType('ongoing');
    setEndDate('');
  };

  const handleAssignTeam = () => {
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    assignTeamMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'default';
      case 'secondary': return 'secondary';
      case 'supervisor': return 'outline';
      case 'coordinator': return 'outline';
      default: return 'outline';
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.assignment_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.active_assignments || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                of {analytics?.total_assignments || 0} total assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                0
              </div>
              <p className="text-xs text-gray-500 mt-1">Total courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                0
              </div>
              <p className="text-xs text-gray-500 mt-1">Issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {analytics?.average_performance?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                → 0.0% trend
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Management Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="assignments">Team Assignments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>

          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign to Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign {providerName} to Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Team</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{team.name}</span>
                            {team.location_name && (
                              <span className="text-xs text-gray-500">({team.location_name})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Assignment Role</label>
                  <Select value={assignmentRole} onValueChange={(value: any) => setAssignmentRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Oversight Level</label>
                  <Select value={oversightLevel} onValueChange={(value: any) => setOversightLevel(value)}>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Assignment Type</label>
                  <Select value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="project_based">Project Based</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(assignmentType === 'project_based' || assignmentType === 'temporary') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAssignDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignTeam}
                    disabled={!selectedTeam || assignTeamMutation.isPending}
                    className="flex-1"
                  >
                    {assignTeamMutation.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="assignments" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Assignments ({assignments.length})</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAssignments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{assignment.team_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {assignment.location_name && (
                                <>
                                  <MapPin className="h-3 w-3" />
                                  <span>{assignment.location_name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{assignment.member_count} members</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleColor(assignment.assignment_role)}>
                            {assignment.assignment_role.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {assignment.oversight_level}
                          </Badge>
                          <Badge variant={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Started: {new Date(assignment.start_date).toLocaleDateString()}</span>
                          </div>
                          {assignment.end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Ends: {new Date(assignment.end_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {assignment.assignment_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeAssignmentMutation.mutate(assignment)}
                            disabled={removeAssignmentMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team assignments found</p>
                  <p className="text-sm">Assign this provider to teams to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
              <p className="text-gray-500">Detailed performance metrics and reporting dashboard</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities">
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Training Capabilities</h3>
              <p className="text-gray-500">Manage provider training capabilities and certifications</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}