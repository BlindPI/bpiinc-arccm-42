import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertCircle
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
    </div>
  );
}