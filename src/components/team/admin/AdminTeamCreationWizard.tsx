
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { LocationService } from '@/services/location/locationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, MapPin, Users, Plus } from 'lucide-react';

interface AdminTeamCreationWizardProps {
  onTeamCreated?: () => void;
  onCancel?: () => void;
}

export const AdminTeamCreationWizard: React.FC<AdminTeamCreationWizardProps> = ({
  onTeamCreated,
  onCancel
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: 'provider_team',
    location_id: '',
    provider_id: ''
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => LocationService.getAllLocations()
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders()
  });

  const createTeamMutation = useMutation({
    mutationFn: (teamData: any) => teamManagementService.createTeamWithLocation(teamData),
    onSuccess: () => {
      toast.success('Team created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onTeamCreated?.();
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

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    createTeamMutation.mutate({
      ...formData,
      created_by: user.id
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create New Team (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>

            <div>
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the team's purpose and responsibilities"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="team-type">Team Type</Label>
              <Select
                value={formData.team_type}
                onValueChange={(value) => handleInputChange('team_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider_team">Provider Team</SelectItem>
                  <SelectItem value="location_team">Location Team</SelectItem>
                  <SelectItem value="administrative_team">Administrative Team</SelectItem>
                  <SelectItem value="training_team">Training Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Assignment */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-select" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Primary Location
              </Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => handleInputChange('location_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary location" />
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

            {/* Provider Assignment */}
            <div>
              <Label htmlFor="provider-select" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Associated Provider (Optional)
              </Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => handleInputChange('provider_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Provider</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name} - {provider.provider_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={createTeamMutation.isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
