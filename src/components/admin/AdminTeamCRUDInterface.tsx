import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  Users, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { AdminTeamService, type AdminTeamCreateData, type AdminTeamUpdateData } from '@/services/team/AdminTeamService';
import { useAdminTeamData } from '@/hooks/useAdminTeamContext';
import type { GlobalTeamData } from '@/hooks/useAdminTeamContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  provider_id: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata: Record<string, any>;
  monthly_targets: Record<string, any>;
}

interface TeamFormProps {
  team?: GlobalTeamData;
  onClose: () => void;
  onSuccess: () => void;
}

function TeamForm({ team, onClose, onSuccess }: TeamFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!team;

  const [formData, setFormData] = useState<TeamFormData>({
    name: team?.name || '',
    description: team?.description || '',
    team_type: team?.team_type || 'operational',
    location_id: team?.location_id || '',
    provider_id: team?.provider_id?.toString() || '',
    status: team?.status || 'active',
    metadata: team?.metadata || {},
    monthly_targets: team?.monthly_targets || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTeamMutation = useMutation({
    mutationFn: (data: AdminTeamCreateData) => AdminTeamService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-statistics'] });
      toast({
        title: 'Team Created',
        description: 'Team has been created successfully.',
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: AdminTeamUpdateData }) => 
      AdminTeamService.updateTeam(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-statistics'] });
      toast({
        title: 'Team Updated',
        description: 'Team has been updated successfully.',
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team',
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (!formData.team_type) {
      newErrors.team_type = 'Team type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      team_type: formData.team_type,
      location_id: formData.location_id || undefined,
      provider_id: formData.provider_id || undefined, // Keep as string
      metadata: formData.metadata,
      monthly_targets: formData.monthly_targets,
    };

    if (isEditing && team) {
      updateTeamMutation.mutate({
        teamId: team.id,
        data: {
          ...submitData,
          status: formData.status,
        },
      });
    } else {
      createTeamMutation.mutate(submitData);
    }
  };

  const isLoading = createTeamMutation.isPending || updateTeamMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Team Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter team name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter team description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="team_type">Team Type *</Label>
            <Select
              value={formData.team_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, team_type: value }))}
            >
              <SelectTrigger className={errors.team_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
            {errors.team_type && <p className="text-sm text-red-500 mt-1">{errors.team_type}</p>}
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location_id">Location</Label>
            <Input
              id="location_id"
              value={formData.location_id}
              onChange={(e) => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
              placeholder="Location ID (optional)"
            />
          </div>

          <div>
            <Label htmlFor="provider_id">Provider</Label>
            <Input
              id="provider_id"
              value={formData.provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
              placeholder="Provider ID (optional)"
              type="number"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEditing ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}

interface DeleteTeamDialogProps {
  team: GlobalTeamData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteTeamDialog({ team, open, onOpenChange, onSuccess }: DeleteTeamDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => AdminTeamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-statistics'] });
      toast({
        title: 'Team Deleted',
        description: 'Team has been deleted successfully.',
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete team',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteTeamMutation.mutate(team.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Team
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the team "{team.name}"? This action cannot be undone.
            {team.member_count > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">
                  ⚠️ This team has {team.member_count} active member(s). 
                  You must remove all members before deleting the team.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTeamMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTeamMutation.isPending || team.member_count > 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteTeamMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Team
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminTeamCRUDInterface() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<GlobalTeamData | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<GlobalTeamData | null>(null);

  const { data: teams = [], isLoading, refetch } = useAdminTeamData();

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const handleDeleteSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-muted-foreground">
            Create, edit, and manage teams across the organization
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <TeamForm
              onClose={() => setCreateDialogOpen(false)}
              onSuccess={handleCreateSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{team.name}</h3>
                    <Badge
                      variant={team.status === 'active' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {team.status === 'active' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">{team.team_type}</Badge>
                  </div>
                  
                  {team.description && (
                    <p className="text-muted-foreground mb-3">{team.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{team.member_count} members</span>
                    </div>
                    
                    {team.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{team.location.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>Performance: {team.performance_score}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTeam(team)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTeam(team)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first team.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {editingTeam && (
            <TeamForm
              team={editingTeam}
              onClose={() => setEditingTeam(null)}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      {deletingTeam && (
        <DeleteTeamDialog
          team={deletingTeam}
          open={!!deletingTeam}
          onOpenChange={(open) => !open && setDeletingTeam(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}