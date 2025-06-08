
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MapPin, Building2 } from 'lucide-react';

interface CreateProviderTeamWizardProps {
  providerId: string;
  locationId?: string;
  onTeamCreated?: (teamId: string) => void;
}

export function CreateProviderTeamWizard({
  providerId,
  locationId,
  onTeamCreated
}: CreateProviderTeamWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    team_type: 'provider_team'
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: typeof teamData) => {
      if (!user?.id) throw new Error('User must be authenticated');
      
      return teamManagementService.createTeam({
        name: data.name,
        description: data.description,
        team_type: data.team_type,
        location_id: locationId,
        provider_id: providerId, // Keep as string, service will handle conversion
        created_by: user.id
      });
    },
    onSuccess: (team) => {
      toast.success('Provider team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      queryClient.invalidateQueries({ queryKey: ['provider-teams', providerId] });
      onTeamCreated?.(team.id);
      
      // Reset form
      setTeamData({
        name: '',
        description: '',
        team_type: 'provider_team'
      });
    },
    onError: (error: any) => {
      console.error('Error creating provider team:', error);
      toast.error('Failed to create provider team');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    createTeamMutation.mutate(teamData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create Provider Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={teamData.name}
              onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={teamData.description}
              onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
              placeholder="Describe the team's purpose and responsibilities"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-type">Team Type</Label>
            <Select
              value={teamData.team_type}
              onValueChange={(value) => setTeamData({ ...teamData, team_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provider_team">Provider Team</SelectItem>
                <SelectItem value="operational">Operational Team</SelectItem>
                <SelectItem value="administrative">Administrative Team</SelectItem>
                <SelectItem value="training">Training Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Team will be assigned to the selected location
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Team will be associated with Provider ID: {providerId}
          </div>

          <div className="flex gap-2 pt-4">
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
