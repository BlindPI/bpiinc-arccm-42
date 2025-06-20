
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamFormData {
  name: string;
  description: string;
  team_type: string;
  location_id: string;
  assigned_ap_user_id: string; // UPDATED: AP user assignment (corrected architecture)
  permissions: Record<string, boolean>;
}

interface StepLocationProviderProps {
  formData: TeamFormData;
  onUpdateFormData: (updates: Partial<TeamFormData>) => void;
  userRole?: string;
  errors: Record<string, string>;
}

export function StepLocationProvider({ 
  formData, 
  onUpdateFormData, 
  userRole,
  errors 
}: StepLocationProviderProps) {
  // Get locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get available AP users for selected location only
  const { data: apUsers = [], isLoading: apUsersLoading } = useQuery({
    queryKey: ['available-ap-users-for-location', formData.location_id],
    queryFn: async () => {
      if (!formData.location_id) return [];
      
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
    enabled: ((['SA', 'AD'].includes(userRole || '') || formData.team_type === 'provider_team') && !!formData.location_id)
  });

  const requiresApUser = formData.team_type === 'provider_team';
  const canSelectApUser = ['SA', 'AD'].includes(userRole || '');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Location & AP User Assignment</h3>
        <p className="text-sm text-muted-foreground">
          Assign the team to a location and optionally associate with an AP user (Authorized Provider).
        </p>
      </div>

      <div className="grid gap-6">
        {/* Location Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Primary Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">
                Select Location <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => {
                  // Clear AP user selection when location changes
                  onUpdateFormData({
                    location_id: value,
                    assigned_ap_user_id: ''
                  });
                }}
              >
                <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select a location..."} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.city}, {location.state}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_id && (
                <p className="text-sm text-red-500">{errors.location_id}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The primary location where this team will operate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AP User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              AP User Association
              {requiresApUser && (
                <Badge className="bg-blue-50 text-blue-700">
                  Required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSelectApUser || requiresApUser ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="assigned_ap_user_id">
                    Select AP User (Authorized Provider) {requiresApUser && <span className="text-red-500">*</span>}
                  </Label>
                  <Select
                    value={formData.assigned_ap_user_id}
                    onValueChange={(value) => onUpdateFormData({ assigned_ap_user_id: value })}
                  >
                    <SelectTrigger className={errors.assigned_ap_user_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder={apUsersLoading ? "Loading AP users..." : "Select an AP user..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No AP user assigned</SelectItem>
                      {apUsers.length === 0 && formData.location_id && !apUsersLoading && (
                        <SelectItem value="" disabled>
                          No available AP users for this location
                        </SelectItem>
                      )}
                      {!formData.location_id && (
                        <SelectItem value="" disabled>
                          Select a location first
                        </SelectItem>
                      )}
                      {apUsers.map((apUser) => (
                        <SelectItem key={apUser.id} value={apUser.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{apUser.display_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {apUser.organization || 'AP User'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assigned_ap_user_id && (
                    <p className="text-sm text-red-500">{errors.assigned_ap_user_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {!formData.location_id
                      ? 'Select a location first to see available AP users'
                      : apUsers.length === 0 && !apUsersLoading
                      ? 'No AP users available for this location - they may already be assigned'
                      : requiresApUser
                      ? 'Provider teams must be associated with an AP user (Authorized Provider)'
                      : 'Optional: Associate this team with a specific AP user'
                    }
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  AP user selection not available for this team type and user role
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Configuration Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Location Assignment:</span>
                <span className={formData.location_id ? 'text-green-600' : 'text-muted-foreground'}>
                  {formData.location_id ? 'Selected' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AP User Association:</span>
                <span className={formData.assigned_ap_user_id ? 'text-green-600' : requiresApUser ? 'text-red-600' : 'text-muted-foreground'}>
                  {formData.assigned_ap_user_id ? 'Selected' : requiresApUser ? 'Required' : 'Optional'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {requiresApUser && !formData.assigned_ap_user_id && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">AP User Required</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Provider teams must be associated with an AP user (Authorized Provider).
                    Please select an AP user to continue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
