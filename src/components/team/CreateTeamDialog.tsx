/**
 * Create Team Dialog
 * Creates teams using RealTeamService
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RealTeamService } from '@/services/team/realTeamService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function CreateTeamDialog() {
  const { user } = useAuth();
  const { trackTeamAction } = useActivityTracker();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationId: '',
    teamType: 'standard'
  });

  // Get locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-for-team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: () => RealTeamService.createTeam({
      name: formData.name,
      description: formData.description,
      team_type: formData.teamType,
      location_id: formData.locationId,
      created_by: user?.id || ''
    }),
    onSuccess: (data) => {
      toast.success('Team created successfully!');
      
      // Track team creation activity
      if (data?.id) {
        trackTeamAction('team_created', data.id, {
          team_name: formData.name,
          team_type: formData.teamType,
          location_id: formData.locationId
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics'] });
      setFormData({ name: '', description: '', locationId: '', teamType: 'standard' });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    
    if (!formData.locationId) {
      toast.error('Please select a location');
      return;
    }
    
    createTeamMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Input
              id="team-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select
              value={formData.teamType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, teamType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-location">Location *</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="flex-1"
            >
              {createTeamMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
