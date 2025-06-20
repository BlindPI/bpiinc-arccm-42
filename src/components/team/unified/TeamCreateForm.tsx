import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedTeamService, CreateTeamRequest } from '@/services/team/unifiedTeamService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Users, 
  FileText,
  Loader2,
  X
} from 'lucide-react';

interface TeamCreateFormProps {
  onCancel: () => void;
  onSuccess: (team: any) => void;
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
  { value: 'inactive', label: 'Inactive' }
];

export function TeamCreateForm({ onCancel, onSuccess }: TeamCreateFormProps) {
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
    location_id: '',
    team_type: 'standard',
    status: 'active',
    assigned_ap_user_id: '', // NEW: AP user assignment
    created_by_ap_user_id: '' // NEW: Track who created the team
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

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

  // Fetch available AP users for selected location only
  const { data: apUsers = [], isLoading: apUsersLoading } = useQuery({
    queryKey: ['available-ap-users-for-team-location', formData.location_id],
    queryFn: async () => {
      if (!formData.location_id || formData.location_id === 'none') return [];
      
      try {
        // Use the RPC function to get location-specific AP users
        const { data, error } = await supabase
          .rpc('get_available_ap_users_for_location', {
            p_location_id: formData.location_id
          });
        
        if (error) throw error;
        
        return data?.map((user: any) => ({
          id: user.user_id,
          display_name: user.display_name,
          email: user.email,
          organization: user.organization
        })) || [];
      } catch (error) {
        console.error('Failed to get available AP users:', error);
        
        // Fallback: Get AP users and filter by location compatibility
        const { data: allAPs, error: apError } = await supabase
          .from('profiles')
          .select('id, display_name, email, organization, location_id')
          .eq('role', 'AP')
          .eq('status', 'ACTIVE')
          .order('display_name');
        
        if (apError) throw apError;
        
        // Filter to users with no location or matching location
        return allAPs?.filter(user =>
          !user.location_id || user.location_id === formData.location_id
        ) || [];
      }
    },
    enabled: !!(formData.location_id && formData.location_id !== 'none')
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: CreateTeamRequest) => UnifiedTeamService.createTeam(teamData),
    onSuccess: (newTeam) => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['unified-teams'] });
      onSuccess(newTeam);
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.message}`);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
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

    const teamData: CreateTeamRequest = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      location_id: formData.location_id === 'none' ? undefined : formData.location_id || undefined,
      assigned_ap_user_id: formData.assigned_ap_user_id || undefined,
      created_by_ap_user_id: formData.created_by_ap_user_id || undefined
    };

    createTeamMutation.mutate(teamData);
  };

  const handleInputChange = (field: keyof CreateTeamRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Create New Team
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
              onValueChange={(value) => {
                // Clear AP user selection when location changes
                setFormData(prev => ({
                  ...prev,
                  location_id: value,
                  assigned_ap_user_id: ''
                }));
              }}
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

          {/* AP User Assignment (Corrected Architecture) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign AP User (Authorized Provider)
            </Label>
            <Select
              value={formData.assigned_ap_user_id}
              onValueChange={(value) => handleInputChange('assigned_ap_user_id', value)}
              disabled={apUsersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={apUsersLoading ? "Loading AP users..." : "Select AP user (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No AP user assigned</SelectItem>
                {apUsers.length === 0 && formData.location_id && formData.location_id !== 'none' && !apUsersLoading && (
                  <SelectItem value="" disabled>
                    No available AP users for this location
                  </SelectItem>
                )}
                {(!formData.location_id || formData.location_id === 'none') && (
                  <SelectItem value="" disabled>
                    Select a location first to see available AP users
                  </SelectItem>
                )}
                {apUsers.map((apUser) => (
                  <SelectItem key={apUser.id} value={apUser.id}>
                    <div>
                      <div className="font-medium">{apUser.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {apUser.email}
                        {apUser.organization && ` • ${apUser.organization}`}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {!formData.location_id || formData.location_id === 'none'
                ? 'Select a location first to see available AP users for assignment'
                : apUsers.length === 0 && !apUsersLoading
                ? 'No AP users available for this location - they may already be assigned'
                : 'AP users serve as Authorized Providers. Selecting an AP user assigns them responsibility for this team.'
              }
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTeamMutation.isPending}
              className="min-w-[120px]"
            >
              {createTeamMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Team
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}