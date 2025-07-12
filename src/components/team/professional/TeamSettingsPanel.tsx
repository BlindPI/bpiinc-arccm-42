
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Archive, Trash2, Settings, MapPin, Building2 } from 'lucide-react';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamSettingsPanelProps {
  team: EnhancedTeam;
  canManage: boolean;
}

export function TeamSettingsPanel({ team, canManage }: TeamSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [editedTeam, setEditedTeam] = useState(team);
  const [isEditing, setIsEditing] = useState(false);

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
    queryKey: ['authorized_providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: Partial<EnhancedTeam>) => {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id || null,
          provider_id: teamData.provider_id || null,
          status: teamData.status,
          metadata: teamData.metadata,
          monthly_targets: teamData.monthly_targets,
          current_metrics: teamData.current_metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select(`
          *,
          locations(*),
          authorized_providers(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Team settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update team: ' + error.message);
    }
  });

  // Archive team mutation
  const archiveTeamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('teams')
        .update({
          status: 'inactive',
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team archived successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    },
    onError: (error: any) => {
      toast.error('Failed to archive team: ' + error.message);
    }
  });

  const handleSave = () => {
    updateTeamMutation.mutate(editedTeam);
  };

  const handleCancel = () => {
    setEditedTeam(team);
    setIsEditing(false);
  };

  if (!canManage) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p>You don't have permission to manage team settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Team Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure team details and management options
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateTeamMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={editedTeam.name}
                onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="team_type">Team Type</Label>
              <Select 
                value={editedTeam.team_type} 
                onValueChange={(value) => setEditedTeam({ ...editedTeam, team_type: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedTeam.description || ''}
              onChange={(e) => setEditedTeam({ ...editedTeam, description: e.target.value })}
              disabled={!isEditing}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location & Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Select 
                value={editedTeam.location_id || ''} 
                onValueChange={(value) => setEditedTeam({ ...editedTeam, location_id: value || undefined })}
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific location</SelectItem>
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
              <Label>Provider</Label>
              <Select 
                value={editedTeam.provider_id || ''} 
                onValueChange={(value) => setEditedTeam({ ...editedTeam, provider_id: value || undefined })}
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No provider</SelectItem>
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

      {/* Team Status */}
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Current Status</Label>
              <p className="text-sm text-muted-foreground">
                Team is currently {editedTeam.status}
              </p>
            </div>
            <Badge variant={editedTeam.status === 'active' ? 'default' : 'secondary'}>
              {editedTeam.status}
            </Badge>
          </div>

          {isEditing && (
            <div>
              <Label>Change Status</Label>
              <Select 
                value={editedTeam.status} 
                onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                  setEditedTeam({ ...editedTeam, status: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="training_target">Monthly Training Sessions</Label>
              <Input
                id="training_target"
                type="number"
                value={editedTeam.monthly_targets?.training_sessions || 0}
                onChange={(e) => setEditedTeam({ 
                  ...editedTeam, 
                  monthly_targets: { 
                    ...editedTeam.monthly_targets, 
                    training_sessions: parseInt(e.target.value) || 0 
                  } 
                })}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="cert_target">Monthly Certifications</Label>
              <Input
                id="cert_target"
                type="number"
                value={editedTeam.monthly_targets?.certifications || 0}
                onChange={(e) => setEditedTeam({ 
                  ...editedTeam, 
                  monthly_targets: { 
                    ...editedTeam.monthly_targets, 
                    certifications: parseInt(e.target.value) || 0 
                  } 
                })}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="quality_target">Quality Score Target (%)</Label>
              <Input
                id="quality_target"
                type="number"
                min="0"
                max="100"
                value={editedTeam.monthly_targets?.quality_score || 85}
                onChange={(e) => setEditedTeam({ 
                  ...editedTeam, 
                  monthly_targets: { 
                    ...editedTeam.monthly_targets, 
                    quality_score: parseInt(e.target.value) || 85 
                  } 
                })}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
            <div>
              <h4 className="font-medium">Archive Team</h4>
              <p className="text-sm text-muted-foreground">
                Archive this team and remove it from active management
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => archiveTeamMutation.mutate()}
              disabled={archiveTeamMutation.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              {archiveTeamMutation.isPending ? 'Archiving...' : 'Archive Team'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
