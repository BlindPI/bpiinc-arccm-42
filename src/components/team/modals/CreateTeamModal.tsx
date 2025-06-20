
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { RealTeamService } from '@/services/team/realTeamService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamModal({ open, onOpenChange }: CreateTeamModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'standard',
    location_id: '',
    assigned_ap_user_id: '' // UPDATED: AP user assignment (corrected architecture)
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch available AP users (corrected architecture)
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users-create-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return RealTeamService.createTeam({
        name: formData.name,
        description: formData.description || undefined,
        team_type: formData.team_type,
        location_id: formData.location_id || undefined,
        assigned_ap_user_id: formData.assigned_ap_user_id || undefined,
        created_by: user.id
      });
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics'] });
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        team_type: 'standard',
        location_id: '',
        assigned_ap_user_id: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    createTeamMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional team description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="team_type">Team Type</Label>
            <Select value={formData.team_type} onValueChange={(value) => setFormData({ ...formData, team_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Team</SelectItem>
                <SelectItem value="provider_team">Provider Team</SelectItem>
                <SelectItem value="training_team">Training Team</SelectItem>
                <SelectItem value="operations">Operations Team</SelectItem>
                <SelectItem value="compliance">Compliance Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location_id">Location (Optional)</Label>
            <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} {location.city && `- ${location.city}, ${location.state}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned_ap_user_id">AP User (Authorized Provider) - Optional</Label>
            <Select value={formData.assigned_ap_user_id} onValueChange={(value) => setFormData({ ...formData, assigned_ap_user_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select AP user (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No AP user assigned</SelectItem>
                {apUsers.map((apUser) => (
                  <SelectItem key={apUser.id} value={apUser.id}>
                    {apUser.display_name} {apUser.organization && `(${apUser.organization})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={createTeamMutation.isPending}
          >
            {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
