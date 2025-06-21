
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProviderLocationService } from '@/services/provider/providerLocationService';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthorizedProvider } from '@/types/provider-management';

interface ProviderLocationAssignmentProps {
  provider: AuthorizedProvider;
  onLocationAssigned?: () => void;
}

export const ProviderLocationAssignment: React.FC<ProviderLocationAssignmentProps> = ({ 
  provider, 
  onLocationAssigned 
}) => {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: unavailableLocations = [] } = useQuery({
    queryKey: ['unavailable-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('primary_location_id')
        .not('primary_location_id', 'is', null);
      
      if (error) throw error;
      return data.map(p => p.primary_location_id);
    }
  });

  const assignLocationMutation = useMutation({
    mutationFn: () => {
      console.log('🔥 FIXED Location Assignment - provider.id:', provider.id, 'type:', typeof provider.id);
      console.log('🔥 FIXED Location Assignment - selectedLocation:', selectedLocation, 'type:', typeof selectedLocation);
      // FIXED: Use UUID directly instead of converting to string
      return ProviderLocationService.assignProviderToLocation(provider.id, selectedLocation);
    },
    onSuccess: () => {
      toast.success('Location assigned successfully! Provider team has been created.');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-teams', provider.id] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-kpis', provider.id] });
      onLocationAssigned?.();
      setSelectedLocation('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign location: ${error.message}`);
    }
  });

  const availableLocations = locations.filter(
    location => !unavailableLocations.includes(location.id) || location.id === provider.primary_location_id
  );

  const handleAssignLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }
    assignLocationMutation.mutate();
  };

  // Get location name from locations if we have the ID
  const primaryLocationName = provider.primary_location_id ? 
    locations.find(loc => loc.id === provider.primary_location_id)?.name : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {provider.primary_location_id ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Currently Assigned</p>
                <p className="text-sm text-green-600">{primaryLocationName || 'Unknown Location'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-medium">No location assigned</p>
            <p className="text-sm text-amber-600">Assign a location to automatically create a provider team</p>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium">
            {provider.primary_location_id ? 'Change Location' : 'Assign Location'}
          </label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location..." />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{location.name}</span>
                    {location.city && (
                      <span className="text-muted-foreground">({location.city})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleAssignLocation}
            disabled={!selectedLocation || assignLocationMutation.isPending}
            className="w-full"
          >
            {assignLocationMutation.isPending ? 'Assigning...' : 
             provider.primary_location_id ? 'Change Location' : 'Assign Location'}
          </Button>
        </div>

        {availableLocations.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No available locations</p>
            <p className="text-xs">All locations are already assigned to other providers</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
