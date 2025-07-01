
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  created_at: string;
  locations?: {
    name: string;
    city?: string;
    state?: string;
  };
  member_count: number;
}

interface EditTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'standard',
    status: 'active',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        team_type: team.team_type || 'standard',
        status: team.status,
      });
    }
  }, [team]);

  const updateTeamMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      if (!team) throw new Error('No team selected');

      const { data, error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          description: updates.description,
          team_type: updates.team_type,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) {
        // Provide more user-friendly error messages
        if (error.code === 'PGRST301') {
          throw new Error('You do not have permission to edit this team');
        } else if (error.code === '42501') {
          throw new Error('Insufficient permissions to update team');
        } else {
          throw new Error(`Failed to update team: ${error.message}`);
        }
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Team updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teams-professional'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Team update error:', error);
      toast.error(error.message || 'Failed to update team');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    updateTeamMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="edit-team-description">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription id="edit-team-description">
            Update the team information including name, description, type, and status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
              required
              disabled={updateTeamMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the team's purpose and responsibilities"
              rows={3}
              disabled={updateTeamMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_type">Team Type</Label>
            <Select
              value={formData.team_type}
              onValueChange={(value) => setFormData({ ...formData, team_type: value })}
              disabled={updateTeamMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Team</SelectItem>
                <SelectItem value="training_team">Training Team</SelectItem>
                <SelectItem value="provider_team">Provider Team</SelectItem>
                <SelectItem value="operations">Operations Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={updateTeamMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
