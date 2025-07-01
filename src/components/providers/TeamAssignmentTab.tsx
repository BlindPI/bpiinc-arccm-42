import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Target,
  AlertCircle,
  Eye,
  Settings,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User,
  TrendingUp,
  Activity,
  BookOpen,
  Shield
} from 'lucide-react';

interface TeamAssignmentTabProps {
  providerId: string;
  assignments: any[];
  onAssignmentChange: () => void;
}

export function TeamAssignmentTab({ providerId, assignments, onAssignmentChange }: TeamAssignmentTabProps) {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Fetch available teams for assignment
  const { data: availableTeams = [] } = useQuery({
    queryKey: ['available-teams', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_type,
          status,
          location_id,
          locations:location_id (
            id,
            name,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .not('id', 'in', `(
          SELECT team_id 
          FROM provider_team_assignments 
          WHERE provider_id = '${providerId}' 
          AND status = 'active'
        )`);
      
      if (error) {
        console.error('Error fetching available teams:', error);
        return [];
      }
      
      return data || [];
    }
  });

  // Fetch detailed team member information with comprehensive roster metrics
  const { data: teamMembersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members-detailed', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      
      console.log('DEBUG - Fetching comprehensive team data for team:', selectedTeamId);
      
      // Try multiple approaches to get team member data
      const approaches = [
        // Approach 1: Direct team_members query with profiles and enhanced data
        async () => {
          const { data, error } = await supabase
            .from('team_members')
            .select(`
              id,
              user_id,
              role,
              status,
              assignment_start_date,
              assignment_end_date,
              team_position,
              permissions,
              last_activity,
              profiles:user_id (
                id,
                display_name,
                email,
                role,
                created_at,
                updated_at
              )
            `)
            .eq('team_id', selectedTeamId)
            .eq('status', 'active');
          
          console.log('DEBUG - Approach 1 (direct query) result:', { data, error });
          return { approach: 'direct', data, error };
        },
        
        // Approach 2: Use existing RLS bypass function
        async () => {
          const { data, error } = await supabase
            .rpc('get_team_members_bypass_rls', { p_team_id: selectedTeamId });
          
          console.log('DEBUG - Approach 2 (RLS bypass) result:', { data, error });
          return { approach: 'rls_bypass', data, error };
        },
        
        // Approach 3: Use alternative function
        async () => {
          const { data, error } = await supabase
            .rpc('fetch_team_members_with_profiles', { p_team_id: selectedTeamId });
          
          console.log('DEBUG - Approach 3 (fetch function) result:', { data, error });
          return { approach: 'fetch_function', data, error };
        }
      ];
      
      // Try each approach and return the first successful one
      for (const approach of approaches) {
        try {
          const result = await approach();
          if (result.data && !result.error) {
            console.log('DEBUG - Successful approach:', result.approach);
            return result.data;
          }
        } catch (err) {
          console.log('DEBUG - Approach failed:', err);
        }
      }
      
      console.log('DEBUG - All approaches failed, returning empty array');
      return [];
    },
    enabled: !!selectedTeamId
  });

  // Fetch enhanced roster metrics for the selected team
  const { data: rosterMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['roster-metrics', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      
      try {
        // Fetch certificates for team members
        const { data: certificates } = await supabase
          .from('certificates')
          .select('id, status, created_at, user_id')
          .in('user_id', teamMembersData?.map((m: any) => m.user_id) || []);
        
        // Fetch enrollments for team members
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, status, created_at, user_id, progress')
          .in('user_id', teamMembersData?.map((m: any) => m.user_id) || []);
        
        // Calculate metrics
        const totalMembers = teamMembersData?.length || 0;
        const activeCertificates = certificates?.filter(c => c.status === 'active').length || 0;
        const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
        const inProgressEnrollments = enrollments?.filter(e => e.status === 'in_progress').length || 0;
        
        return {
          totalMembers,
          activeCertificates,
          completedEnrollments,
          inProgressEnrollments,
          certificationRate: totalMembers > 0 ? (activeCertificates / totalMembers) * 100 : 0,
          completionRate: enrollments?.length > 0 ? (completedEnrollments / enrollments.length) * 100 : 0,
          averageProgress: enrollments?.length > 0 ?
            enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length : 0,
          recentActivity: teamMembersData?.filter((m: any) => {
            const lastActivity = new Date(m.last_activity || m.assignment_start_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastActivity > thirtyDaysAgo;
          }).length || 0
        };
      } catch (error) {
        console.error('Error fetching roster metrics:', error);
        return null;
      }
    },
    enabled: !!selectedTeamId && !!teamMembersData
  });

  // Assign provider to team mutation
  const assignToTeamMutation = useMutation({
    mutationFn: async (assignmentData: {
      teamId: string;
      assignmentRole: string;
      oversightLevel: string;
      assignmentType: string;
      endDate?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('assign_provider_to_team', {
          p_provider_id: providerId,
          p_team_id: assignmentData.teamId,
          p_assignment_role: assignmentData.assignmentRole,
          p_oversight_level: assignmentData.oversightLevel,
          p_assignment_type: assignmentData.assignmentType,
          p_end_date: assignmentData.endDate || null
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Provider assigned to team successfully');
      setShowAssignDialog(false);
      onAssignmentChange();
      queryClient.invalidateQueries({ queryKey: ['available-teams', providerId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to assign provider to team: ${error.message}`);
    }
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('provider_team_assignments')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Assignment removed successfully');
      onAssignmentChange();
      queryClient.invalidateQueries({ queryKey: ['available-teams', providerId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove assignment: ${error.message}`);
    }
  });

  const handleAssignToTeam = (formData: FormData) => {
    const teamId = formData.get('teamId') as string;
    const assignmentRole = formData.get('assignmentRole') as string;
    const oversightLevel = formData.get('oversightLevel') as string;
    const assignmentType = formData.get('assignmentType') as string;
    const endDate = formData.get('endDate') as string;

    if (!teamId || !assignmentRole || !oversightLevel || !assignmentType) {
      toast.error('Please fill in all required fields');
      return;
    }

    assignToTeamMutation.mutate({
      teamId,
      assignmentRole,
      oversightLevel,
      assignmentType,
      endDate: endDate || undefined
    });
  };

  const handleRemoveAssignment = (assignmentId: string, teamName: string) => {
    if (confirm(`Are you sure you want to remove the assignment to "${teamName}"?`)) {
      removeAssignmentMutation.mutate(assignmentId);
    }
  };

  const activeAssignments = assignments.filter(a => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Manage provider assignments to teams and their roles
          </p>
        </div>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign to Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Provider to Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAssignToTeam(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="teamId">Team</Label>
                <Select name="teamId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex flex-col">
                          <span>{team.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {team.locations?.name} • {team.team_type}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignmentRole">Assignment Role</Label>
                <Select name="assignmentRole" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary_trainer">Primary Trainer</SelectItem>
                    <SelectItem value="support_trainer">Support Trainer</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="oversightLevel">Oversight Level</Label>
                <Select name="oversightLevel" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select oversight level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="manage">Manage</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignmentType">Assignment Type</Label>
                <Select name="assignmentType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="project_based">Project Based</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  name="endDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={assignToTeamMutation.isPending}
                  className="flex-1"
                >
                  {assignToTeamMutation.isPending ? 'Assigning...' : 'Assign to Team'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAssignDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments List */}
      {activeAssignments.length > 0 ? (
        <div className="grid gap-4">
          {activeAssignments.map((assignment) => (
            <Card key={assignment.assignment_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assignment.team_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">{assignment.assignment_role}</Badge>
                        <Badge variant="outline">{assignment.oversight_level}</Badge>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{assignment.location_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{assignment.member_count} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <p className="font-medium">Performance: {assignment.performance_score || 0}</p>
                      <p className="text-muted-foreground">
                        Since {new Date(assignment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* View Team Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setSelectedTeamId(assignment.team_id);
                        setShowTeamDetailsModal(true);
                        toast.info(`Loading team details for ${assignment.team_name}...`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    
                    {/* Edit Assignment Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setEditingAssignment(assignment);
                        setShowEditAssignmentModal(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.assignment_id, assignment.team_name)}
                      disabled={removeAssignmentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Team Assignments</h3>
          <p className="text-sm">
            This provider is not currently assigned to any teams.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => setShowAssignDialog(true)}
            disabled={availableTeams.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign to Team
          </Button>
        </div>
      )}

      {/* Team Details Modal */}
      <Dialog open={showTeamDetailsModal} onOpenChange={setShowTeamDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedAssignment?.team_name} - Team Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Team Members</TabsTrigger>
                <TabsTrigger value="metrics">Roster Metrics</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Team Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedAssignment.location_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedAssignment.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Since {new Date(selectedAssignment.start_date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Role:</span>
                        <Badge variant="secondary">{selectedAssignment.assignment_role}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Oversight:</span>
                        <Badge variant="outline">{selectedAssignment.oversight_level}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Performance:</span>
                        <span className="text-sm font-medium">{selectedAssignment.performance_score || 0}/5.0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Team Members Tab */}
              <TabsContent value="members" className="space-y-4">
                {isLoadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading team members...</p>
                  </div>
                ) : teamMembersData && teamMembersData.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembersData.map((member: any) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{member.profiles?.display_name || member.display_name || 'Unknown User'}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                  {member.team_position && (
                                    <span>• {member.team_position}</span>
                                  )}
                                  {member.profiles?.email && (
                                    <span>• {member.profiles.email}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">
                                Since {new Date(member.assignment_start_date).toLocaleDateString()}
                              </p>
                              {member.last_activity && (
                                <p className="text-xs text-muted-foreground">
                                  Last active: {new Date(member.last_activity).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Team Members</h3>
                    <p className="text-sm">No active team members found for this team.</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Roster Metrics Tab */}
              <TabsContent value="metrics" className="space-y-4">
                {isLoadingMetrics ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading roster metrics...</p>
                  </div>
                ) : rosterMetrics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certification Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Certification Rate</span>
                          <span className="font-medium">{rosterMetrics.certificationRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={rosterMetrics.certificationRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {rosterMetrics.activeCertificates} of {rosterMetrics.totalMembers} members certified
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Training Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Completion Rate</span>
                          <span className="font-medium">{rosterMetrics.completionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={rosterMetrics.completionRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {rosterMetrics.completedEnrollments} completed, {rosterMetrics.inProgressEnrollments} in progress
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Team Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Recent Activity</span>
                          <span className="font-medium">{rosterMetrics.recentActivity} members</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Active in the last 30 days
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Average Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Overall Progress</span>
                          <span className="font-medium">{rosterMetrics.averageProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={rosterMetrics.averageProgress} className="h-2" />
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Metrics Available</h3>
                    <p className="text-sm">Unable to load roster metrics for this team.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={showEditAssignmentModal} onOpenChange={setShowEditAssignmentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editingAssignment && (
            <form onSubmit={(e) => {
              e.preventDefault();
              toast.info('Edit assignment functionality coming soon!');
              setShowEditAssignmentModal(false);
            }} className="space-y-4">
              <div>
                <Label htmlFor="editRole">Assignment Role</Label>
                <Select name="editRole" defaultValue={editingAssignment.assignment_role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary_trainer">Primary Trainer</SelectItem>
                    <SelectItem value="support_trainer">Support Trainer</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editOversight">Oversight Level</Label>
                <Select name="editOversight" defaultValue={editingAssignment.oversight_level}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="manage">Manage</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditAssignmentModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}