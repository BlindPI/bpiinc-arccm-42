
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { teamManagementService } from '@/services/team/teamManagementService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CreateTeamRequest } from '@/types/team-management';

interface TeamCreationFormProps {
  onSuccess?: (teamId: string) => void;
  onCancel?: () => void;
}

export function TeamCreationForm({ onSuccess, onCancel }: TeamCreationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CreateTeamRequest>>({
    name: '',
    description: '',
    team_type: 'training',
    location_id: '',
    provider_id: '',
    metadata: {},
    created_by: user?.id || ''
  });

  // Get locations for dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Get providers for dropdown
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (teamData: CreateTeamRequest) => 
      teamManagementService.createTeam(teamData),
    onSuccess: (team) => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onSuccess?.(team.id);
    },
    onError: (error: any) => {
      toast.error('Failed to create team: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Team name is required');
      return;
    }

    createTeamMutation.mutate({
      name: formData.name,
      description: formData.description || '',
      team_type: formData.team_type || 'training',
      location_id: formData.location_id || undefined,
      provider_id: formData.provider_id || undefined,
      metadata: formData.metadata || {},
      created_by: user?.id || ''
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Team</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select 
              value={formData.team_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, team_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="training">Training Team</SelectItem>
                <SelectItem value="emergency">Emergency Response</SelectItem>
                <SelectItem value="safety">Safety Team</SelectItem>
                <SelectItem value="compliance">Compliance Team</SelectItem>
                <SelectItem value="operations">Operations Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select 
              value={formData.location_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location (optional)" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Authorized Provider</Label>
            <Select 
              value={formData.provider_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider (optional)" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={createTeamMutation.isPending}
              className="flex-1"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
