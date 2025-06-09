
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamManagementService } from '@/services/team/teamManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Users, Building2 } from 'lucide-react';

interface TeamCreationFormProps {
  onTeamCreated?: (teamId: string) => void;
  onSuccess?: (teamId: string) => void;
  onCancel?: () => void;
  locationId?: string;
  providerId?: string;
}

export function TeamCreationForm({ 
  onTeamCreated, 
  onSuccess, 
  onCancel, 
  locationId, 
  providerId 
}: TeamCreationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'operational',
    location_id: locationId || '',
    provider_id: providerId || '',
    created_by: user?.id || '',
  });

  const createTeamMutation = useMutation({
    mutationFn: (teamData: typeof formData) => TeamManagementService.createTeam(teamData),
    onSuccess: (team) => {
      if (!team) throw new Error('Failed to create team');
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      onTeamCreated?.(team.id);
      onSuccess?.(team.id);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        team_type: 'operational',
        location_id: locationId || '',
        provider_id: providerId || '',
        created_by: user?.id || '',
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

    if (!user?.id) {
      toast.error('User must be authenticated');
      return;
    }

    const teamData = {
      ...formData,
      created_by: user.id,
    };

    createTeamMutation.mutate(teamData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create New Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the team's purpose and responsibilities"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select
              value={formData.team_type}
              onValueChange={(value) => handleChange('team_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational Team</SelectItem>
                <SelectItem value="project_team">Project Team</SelectItem>
                <SelectItem value="administrative">Administrative Team</SelectItem>
                <SelectItem value="training">Training Team</SelectItem>
                <SelectItem value="provider_team">Provider Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Team will be assigned to the selected location
            </div>
          )}

          {providerId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Team will be associated with Provider ID: {providerId}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="flex-1"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
