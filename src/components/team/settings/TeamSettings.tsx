import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Save, 
  Shield, 
  Users, 
  MapPin, 
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

interface TeamSettingsProps {
  team: any;
  canEdit: boolean;
  onUpdate: (team: any) => void;
}

export function TeamSettings({ team, canEdit, onUpdate }: TeamSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name || '',
    description: team.description || '',
    team_type: team.team_type || 'operational',
    status: team.status || 'active',
    performance_score: team.performance_score || 0,
    metadata: {
      visibility: team.metadata?.visibility || 'private',
      auto_assign: team.metadata?.auto_assign || false,
      notifications_enabled: team.metadata?.notifications_enabled || true,
      approval_required: team.metadata?.approval_required || false,
      ...team.metadata
    }
  });
  
  const { toast } = useToast();

  const handleSave = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          description: formData.description,
          team_type: formData.team_type,
          status: formData.status,
          performance_score: formData.performance_score,
          metadata: formData.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate({ ...team, ...data });
      toast({
        title: "Settings Updated",
        description: "Team settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update team settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMetadata = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Team Settings</h2>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-type">Team Type</Label>
              <Select 
                value={formData.team_type} 
                onValueChange={(value) => updateFormData('team_type', value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              disabled={!canEdit}
              placeholder="Describe the team's purpose and responsibilities..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateFormData('status', value)}
                disabled={!canEdit}
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
            <div className="space-y-2">
              <Label htmlFor="performance-score">Performance Score (%)</Label>
              <Input
                id="performance-score"
                type="number"
                min="0"
                max="100"
                value={formData.performance_score}
                onChange={(e) => updateFormData('performance_score', parseInt(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Team Visibility</Label>
            <Select 
              value={formData.metadata.visibility} 
              onValueChange={(value) => updateMetadata('visibility', value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private - Only members can see</SelectItem>
                <SelectItem value="organization">Organization - All users can see</SelectItem>
                <SelectItem value="public">Public - Visible to everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications for team updates and activities
                </p>
              </div>
              <Switch
                checked={formData.metadata.notifications_enabled}
                onCheckedChange={(checked) => updateMetadata('notifications_enabled', checked)}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-assign Members</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically assign new members to available tasks
                </p>
              </div>
              <Switch
                checked={formData.metadata.auto_assign}
                onCheckedChange={(checked) => updateMetadata('auto_assign', checked)}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Approval Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require approval for member actions and changes
                </p>
              </div>
              <Switch
                checked={formData.metadata.approval_required}
                onCheckedChange={(checked) => updateMetadata('approval_required', checked)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location & Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Location</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                {team.location?.name || 'No location assigned'}
              </p>
              {team.location?.city && team.location?.state && (
                <p className="text-xs text-muted-foreground">
                  {team.location.city}, {team.location.state}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Provider Assignment</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                {team.provider?.provider_name || team.provider?.name || 'No provider assigned'}
              </p>
              {team.provider?.provider_url && (
                <Badge variant="outline" className="mt-1">
                  {team.provider.provider_url}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{team.members?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {team.members?.filter(m => m.status === 'active').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formData.performance_score}%</p>
              <p className="text-sm text-muted-foreground">Performance</p>
            </div>
            <div className="text-center">
              <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                {formData.status}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canEdit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                You have read-only access to these settings. Contact an administrator to make changes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}