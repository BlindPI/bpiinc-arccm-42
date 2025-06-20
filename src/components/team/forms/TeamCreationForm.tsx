
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
    assigned_ap_user_id: '', // UPDATED: Direct AP user assignment (corrected architecture)
    provider_id: '', // Legacy: Deprecated - will be removed
    metadata: {},
    created_by: user?.id || '',
    created_by_ap_user_id: user?.role === 'AP' ? user?.id : '' // NEW: Track AP user who created team
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

  // Get AP users for dropdown (corrected architecture)
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users'],
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

  // Legacy providers query for backward compatibility
  const { data: legacyProviders = [] } = useQuery({
    queryKey: ['legacy-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers_legacy')
        .select('*')
        .eq('status', 'APPROVED')
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
      assigned_ap_user_id: formData.assigned_ap_user_id || undefined,
      created_by_ap_user_id: formData.created_by_ap_user_id || undefined,
      // provider_id removed - deprecated in corrected architecture
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
            <Label htmlFor="ap-user">Assign AP User (Authorized Provider)</Label>
            <Select
              value={formData.assigned_ap_user_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_ap_user_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AP user (optional)" />
              </SelectTrigger>
              <SelectContent>
                {apUsers.map((apUser) => (
                  <SelectItem key={apUser.id} value={apUser.id}>
                    {apUser.display_name} {apUser.organization && `(${apUser.organization})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              AP users serve as Authorized Providers for teams. Select an AP user to assign them to this team.
            </p>
          </div>

          {/* Legacy provider support for backward compatibility */}
          {legacyProviders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="legacy-provider">Legacy Provider (Deprecated)</Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select legacy provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {legacyProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-amber-600">
                ⚠️ Legacy provider system. Use AP User assignment above for new teams.
              </p>
            </div>
          )}

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
