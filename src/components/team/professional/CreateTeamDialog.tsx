
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: () => void;
}

export function CreateTeamDialog({ 
  open, 
  onOpenChange, 
  onTeamCreated 
}: CreateTeamDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'standard',
    location_id: '',
  });

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

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: typeof formData) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication error. Please log in again.');
      }
      
      if (!user?.id) {
        throw new Error('User not authenticated. Please log in.');
      }

      console.log('Creating team with user ID:', user.id);
      console.log('Team data:', teamData);

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description || null,
          team_type: teamData.team_type,
          location_id: teamData.location_id || null,
          status: 'active',
          performance_score: 0,
          created_by: user.id // Ensure this is a valid UUID
        })
        .select()
        .single();

      if (error) {
        console.error('Team creation error:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      onTeamCreated();
      setFormData({
        name: '',
        description: '',
        team_type: 'standard',
        location_id: '',
      });
    },
    onError: (error: any) => {
      console.error('Team creation failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('uuid')) {
        toast.error('Authentication error. Please refresh the page and try again.');
      } else if (error.message?.includes('not authenticated')) {
        toast.error('Please log in to create a team.');
      } else {
        toast.error(`Failed to create team: ${error.message}`);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    createTeamMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_type">Team Type</Label>
            <Select
              value={formData.team_type}
              onValueChange={(value) => setFormData({ ...formData, team_type: value })}
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
            <Label htmlFor="location">Location (Optional)</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => setFormData({ ...formData, location_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No location assigned</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} {location.city && `- ${location.city}, ${location.state}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
