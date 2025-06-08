
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building2, AlertCircle } from 'lucide-react';

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
  userRole = 'IT',
  errors 
}: StepLocationProviderProps) {
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('id, name, provider_type, status')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: formData.team_type === 'provider_team'
  });

  const selectedLocation = locations.find(loc => loc.id === formData.location_id);
  const selectedProvider = providers.find(prov => prov.id === parseInt(formData.provider_id));
  const requiresProvider = formData.team_type === 'provider_team';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Location & Provider Assignment</h3>
        <p className="text-sm text-muted-foreground">
          Configure where your team operates and any provider associations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Location Selection */}
        <div className="space-y-2">
          <Label>
            Primary Location <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.location_id}
            onValueChange={(value) => onUpdateFormData({ location_id: value })}
          >
            <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select team location..." />
            </SelectTrigger>
            <SelectContent>
              {locationsLoading ? (
                <SelectItem value="" disabled>Loading locations...</SelectItem>
              ) : locations.length === 0 ? (
                <SelectItem value="" disabled>No locations available</SelectItem>
              ) : (
                locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        {(location.city || location.state) && (
                          <div className="text-xs text-muted-foreground">
                            {[location.city, location.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.location_id && (
            <p className="text-sm text-red-500">{errors.location_id}</p>
          )}
          <p className="text-xs text-muted-foreground">
            The primary location where this team operates
          </p>
        </div>

        {/* Selected Location Preview */}
        {selectedLocation && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedLocation.name}
                <Badge className="bg-blue-50 text-blue-700">
                  Selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {[selectedLocation.city, selectedLocation.state].filter(Boolean).join(', ') || 'Location details not specified'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Provider Selection (if required) */}
        {requiresProvider && (
          <div className="space-y-2">
            <Label>
              Associated Provider <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => onUpdateFormData({ provider_id: value })}
            >
              <SelectTrigger className={errors.provider_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select authorized provider..." />
              </SelectTrigger>
              <SelectContent>
                {providersLoading ? (
                  <SelectItem value="" disabled>Loading providers...</SelectItem>
                ) : providers.length === 0 ? (
                  <SelectItem value="" disabled>No authorized providers available</SelectItem>
                ) : (
                  providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {provider.provider_type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.provider_id && (
              <p className="text-sm text-red-500">{errors.provider_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Required for provider teams - the authorized organization this team represents
            </p>
          </div>
        )}

        {/* Selected Provider Preview */}
        {selectedProvider && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedProvider.name}
                <Badge className="bg-orange-50 text-orange-700">
                  Provider
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type: {selectedProvider.provider_type.replace('_', ' ')}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {selectedProvider.status}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Provider Team Information */}
        {formData.team_type === 'provider_team' && !selectedProvider && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Provider Team Requirements</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Provider teams must be associated with an authorized provider organization. 
                    This enables proper oversight, compliance tracking, and performance monitoring.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-specific Guidance */}
        {userRole && ['SA', 'AD'].includes(userRole) && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Administrator Privileges</h4>
                  <p className="text-sm text-green-700 mt-1">
                    As a {userRole === 'SA' ? 'System Administrator' : 'Administrator'}, you can create teams 
                    across all locations and associate them with any authorized provider.
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
