import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedTeamService, UpdateTeamRequest, EnhancedTeam } from '@/services/team/unifiedTeamService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Users, 
  FileText,
  Loader2,
  X,
  Save
} from 'lucide-react';

interface TeamEditFormProps {
  team: EnhancedTeam;
  onCancel: () => void;
  onSuccess: (team: EnhancedTeam) => void;
}

interface Location {
  id: string;
  name: string;
  address?: string;
}

const TEAM_TYPES = [
  { value: 'standard', label: 'Standard Team' },
  { value: 'training', label: 'Training Team' },
  { value: 'assessment', label: 'Assessment Team' },
  { value: 'compliance', label: 'Compliance Team' },
  { value: 'emergency', label: 'Emergency Response Team' },
  { value: 'specialized', label: 'Specialized Team' }
];

const TEAM_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' }
];

export function TeamEditForm({ team, onCancel, onSuccess }: TeamEditFormProps) {
  const [formData, setFormData] = useState<UpdateTeamRequest>({
    name: team.name,
    description: team.description || '',
    location_id: team.location_id || '',
    team_type: team.team_type || 'standard',
    status: team.status || 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const queryClient = useQueryClient();

  // Track changes
  useEffect(() => {
    const changed = 
      formData.name !== team.name ||
      formData.description !== (team.description || '') ||
      formData.location_id !== (team.location_id || '') ||
      formData.team_type !== (team.team_type || 'standard') ||
      formData.status !== (team.status || 'active');
    
    setHasChanges(changed);
  }, [formData, team]);

  // Fetch available locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (updates: UpdateTeamRequest) => UnifiedTeamService.updateTeam(team.id, updates),
    onSuccess: (updatedTeam) => {
      toast.success('Team updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
      onSuccess(updatedTeam);
    },
    onError: (error: any) => {
      toast.error(`Failed to update team: ${error.message}`);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Team name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    const updates: UpdateTeamRequest = {
      name: formData.name?.trim(),
      description: formData.description?.trim() || undefined,
      location_id: formData.location_id === 'none' ? undefined : formData.location_id || undefined,
      team_type: formData.team_type,
      status: formData.status
    };

    updateTeamMutation.mutate(updates);
  };

  const handleInputChange = (field: keyof UpdateTeamRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleReset = () => {
    setFormData({
      name: team.name,
      description: team.description || '',
      location_id: team.location_id || '',
      team_type: team.team_type || 'standard',
      status: team.status || 'active'
    });
    setErrors({});
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Edit Team: {team.name}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter team name..."
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the team's purpose and responsibilities..."
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Team Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Team Type
            </Label>
            <Select
              value={formData.team_type}
              onValueChange={(value) => handleInputChange('team_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => handleInputChange('location_id', value)}
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select location (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-xs text-muted-foreground">{location.address}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Team Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive' | 'archived') => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Indicator */}
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                You have unsaved changes. Click "Save Changes" to apply them.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset Changes
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateTeamMutation.isPending || !hasChanges}
                className="min-w-[120px]"
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}