
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
  provider_id: string;
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

  // Get providers (only for SA/AD or provider teams)
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: ['SA', 'AD'].includes(userRole || '') || formData.team_type === 'provider_team'
  });

  const requiresProvider = formData.team_type === 'provider_team';
  const canSelectProvider = ['SA', 'AD'].includes(userRole || '');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Location & Provider Assignment</h3>
        <p className="text-sm text-muted-foreground">
          Assign the team to a location and optionally associate with a provider.
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
                onValueChange={(value) => onUpdateFormData({ location_id: value })}
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

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Provider Association
              {requiresProvider && (
                <Badge className="bg-blue-50 text-blue-700">
                  Required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canSelectProvider || requiresProvider ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="provider">
                    Select Provider {requiresProvider && <span className="text-red-500">*</span>}
                  </Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(value) => onUpdateFormData({ provider_id: value })}
                  >
                    <SelectTrigger className={errors.provider_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder={providersLoading ? "Loading providers..." : "Select a provider..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Active Provider
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.provider_id && (
                    <p className="text-sm text-red-500">{errors.provider_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {requiresProvider 
                      ? 'Provider teams must be associated with an authorized provider'
                      : 'Optional: Associate this team with a specific provider'
                    }
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Provider selection not available for this team type and user role
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
                <span>Provider Association:</span>
                <span className={formData.provider_id ? 'text-green-600' : requiresProvider ? 'text-red-600' : 'text-muted-foreground'}>
                  {formData.provider_id ? 'Selected' : requiresProvider ? 'Required' : 'Optional'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {requiresProvider && !formData.provider_id && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Provider Required</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Provider teams must be associated with an authorized provider organization.
                    Please select a provider to continue.
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
