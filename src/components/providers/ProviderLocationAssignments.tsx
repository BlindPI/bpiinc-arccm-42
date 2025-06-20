
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Building2, 
  Users, 
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export function ProviderLocationAssignments() {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Get all authorized providers with location details
  const { data: providers = [] } = useQuery({
    queryKey: ['providers-with-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          organization,
          role,
          status
        `)
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Legacy authorized_providers query for backward compatibility
  const { data: legacyProviders = [] } = useQuery({
    queryKey: ['legacy-provider-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations!primary_location_id(*),
          profiles!inner(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get all locations with provider details
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-with-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          profiles!assigned_ap_user_id(id, display_name, email, organization)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get teams for each location-provider combination
  const { data: locationTeams = [] } = useQuery({
    queryKey: ['location-teams-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations(*),
          provider:authorized_providers(*),
          team_members(count)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Assign provider to location
  const assignProviderMutation = useMutation({
    mutationFn: async ({ providerId, locationId }: { providerId: string; locationId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ primary_location_id: locationId })
        .eq('role', 'AP')
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provider assigned to location successfully');
      queryClient.invalidateQueries({ queryKey: ['providers-with-locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-providers'] });
      setSelectedProvider('');
      setSelectedLocation('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign provider: ${error.message}`);
    }
  });

  // Remove provider from location
  const removeProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ primary_location_id: null })
        .eq('role', 'AP')
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provider removed from location');
      queryClient.invalidateQueries({ queryKey: ['providers-with-locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-providers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove provider: ${error.message}`);
    }
  });

  const assignedProviders = providers.filter(p => p.primary_location_id);
  const unassignedApUsers = providers.filter(p => !p.primary_location_id);
  const assignedLocations = locations.filter(l => l.profiles && l.profiles.length > 0);
  const unassignedLocations = locations.filter(l => !l.profiles || l.profiles.length === 0);

  return (
    <div className="space-y-6">
      {/* Quick Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Quick Provider-Location Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Select Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose provider..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{provider.name}</span>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Select Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose location..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{location.name}</span>
                        <span className="text-muted-foreground">({location.city})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => assignProviderMutation.mutate({ 
                  providerId: selectedProvider, 
                  locationId: selectedLocation 
                })}
                disabled={!selectedProvider || !selectedLocation || assignProviderMutation.isPending}
                className="w-full"
              >
                {assignProviderMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Provider Assignments ({assignedProviders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedProviders.length > 0 ? (
              <div className="space-y-3">
                {assignedProviders.map((provider) => {
                  const teams = locationTeams.filter(t => t.provider?.id === provider.id);
                  return (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{provider.name}</h4>
                          <Badge variant="outline">AP</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{provider.primary_location?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{teams.length} teams</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProviderMutation.mutate(provider.id)}
                        disabled={removeProviderMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No provider assignments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Assigned Locations */}
              {assignedLocations.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2">
                    Assigned Locations ({assignedLocations.length})
                  </h4>
                  <div className="space-y-2">
                    {assignedLocations.map((location) => {
                      const apUser = location.profiles?.[0];
                      const teams = locationTeams.filter(t => t.location?.id === location.id);
                      return (
                        <div key={location.id} className="p-2 border border-green-200 bg-green-50 rounded">
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-green-700">
                            Provider: {provider?.name}
                          </div>
                          <div className="text-sm text-green-700">
                            Teams: {teams.length}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unassigned Locations */}
              {unassignedLocations.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-600 mb-2">
                    Unassigned Locations ({unassignedLocations.length})
                  </h4>
                  <div className="space-y-2">
                    {unassignedLocations.map((location) => (
                      <div key={location.id} className="p-2 border border-amber-200 bg-amber-50 rounded">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-amber-700">
                          {location.city}, {location.state}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Items */}
      {(unassignedProviders.length > 0 || unassignedLocations.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Items Requiring Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unassignedProviders.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">
                    Unassigned Providers ({unassignedProviders.length})
                  </h4>
                  <div className="space-y-2">
                    {unassignedProviders.map((provider) => (
                      <div key={provider.id} className="p-2 bg-white rounded border">
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.profiles?.email}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unassignedLocations.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">
                    Unassigned Locations ({unassignedLocations.length})
                  </h4>
                  <div className="space-y-2">
                    {unassignedLocations.map((location) => (
                      <div key={location.id} className="p-2 bg-white rounded border">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.city}, {location.state}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
