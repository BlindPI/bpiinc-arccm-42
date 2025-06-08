
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  AlertTriangle, 
  Archive,
  MapPin,
  Building2,
  Target,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamSettingsPanelProps {
  team: EnhancedTeam;
  canManage: boolean;
}

export function TeamSettingsPanel({ team, canManage }: TeamSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    team_type: team.team_type,
    location_id: team.location_id || '',
    provider_id: team.provider_id || '',
    status: team.status,
    metadata: team.metadata || {}
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch providers
  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      toast.success('Team settings updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update team settings: ' + error.message);
    }
  });

  // Archive team mutation
  const archiveTeamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('teams')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      toast.success('Team archived successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to archive team: ' + error.message);
    }
  });

  const handleSave = () => {
    updateTeamMutation.mutate(formData);
  };

  const handleArchiveTeam = () => {
    if (window.confirm('Are you sure you want to archive this team? This action can be undone by changing the status back to active.')) {
      archiveTeamMutation.mutate();
    }
  };

  if (!canManage) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to modify team settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
              />
            </div>

            <div>
              <Label htmlFor="team-type">Team Type</Label>
              <Select
                value={formData.team_type}
                onValueChange={(value) => setFormData({ ...formData, team_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational Team</SelectItem>
                  <SelectItem value="training">Training Team</SelectItem>
                  <SelectItem value="management">Management Team</SelectItem>
                  <SelectItem value="specialized">Specialized Team</SelectItem>
                  <SelectItem value="cross_functional">Cross-Functional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the team's purpose and goals"
              rows={3}
            />
          </div>

          <div>
            <Label>Team Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location & Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Provider Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Primary Location</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No location assigned</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {location.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provider Association</Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No provider assigned</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {provider.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Monthly Training Target</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.metadata.monthly_training_target || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    monthly_training_target: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>

            <div>
              <Label>Quality Score Target (%)</Label>
              <Input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={formData.metadata.quality_target || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    quality_target: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>

            <div>
              <Label>Compliance Threshold (%)</Label>
              <Input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={formData.metadata.compliance_threshold || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    compliance_threshold: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Team Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-approve member requests</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve requests to join this team
              </p>
            </div>
            <Switch
              checked={formData.metadata.auto_approve_requests || false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  auto_approve_requests: checked
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Public team visibility</Label>
              <p className="text-sm text-muted-foreground">
                Allow this team to be visible in public directories
              </p>
            </div>
            <Switch
              checked={formData.metadata.public_visibility || false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  public_visibility: checked
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable performance tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track and report team performance metrics
              </p>
            </div>
            <Switch
              checked={formData.metadata.performance_tracking !== false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  performance_tracking: checked
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleArchiveTeam}
          disabled={archiveTeamMutation.isPending}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" />
          {archiveTeamMutation.isPending ? 'Archiving...' : 'Archive Team'}
        </Button>

        <Button
          onClick={handleSave}
          disabled={updateTeamMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
