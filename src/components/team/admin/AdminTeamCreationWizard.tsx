
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
import { useLocationData } from '@/hooks/useLocationData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, MapPin, Users, Plus, UserCog, Shield } from 'lucide-react';

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
    provider_id: '',
    admin_notes: '',
    priority_level: 'normal'
  });

  const { locations = [] } = useLocationData();

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
      created_by: user.id,
      admin_created: true
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          System Administrator Team Creation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create teams with administrative privileges for providers and locations
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Administrative Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Administrative Team Creation</span>
            </div>
            <p className="text-sm text-blue-700">
              As a System Administrator, you can create teams for any provider or location with full administrative controls.
            </p>
          </div>

          {/* Team Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Team Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="priority-level">Priority Level</Label>
                <Select
                  value={formData.priority_level}
                  onValueChange={(value) => handleInputChange('priority_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <SelectItem value="compliance_team">Compliance Team</SelectItem>
                  <SelectItem value="emergency_response">Emergency Response Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location & Provider Assignment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="">No Specific Location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}, {location.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="provider-select" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Associated Provider
                </Label>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => handleInputChange('provider_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Provider Assignment</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name} - {provider.provider_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Administrative Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Administrative Notes</h3>
            <div>
              <Label htmlFor="admin-notes">Internal Notes (Admin Only)</Label>
              <Textarea
                id="admin-notes"
                value={formData.admin_notes}
                onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                placeholder="Add any administrative notes or special instructions for this team"
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
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
              {createTeamMutation.isPending ? 'Creating Team...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
