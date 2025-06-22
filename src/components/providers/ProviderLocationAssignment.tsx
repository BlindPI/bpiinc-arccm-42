
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
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
    mutationFn: async () => {
      console.log('🔥 DEBUG: Starting location assignment mutation');
      console.log('🔥 DEBUG: Provider ID:', provider.id, 'type:', typeof provider.id);
      console.log('🔥 DEBUG: Selected Location:', selectedLocation, 'type:', typeof selectedLocation);
      
      try {
        console.log('🔥 DEBUG: Calling providerRelationshipService.assignProviderToLocation...');
        const result = await providerRelationshipService.assignProviderToLocation(provider.id, selectedLocation, 'primary');
        console.log('🔥 DEBUG: Service call completed successfully, result:', result);
        return result;
      } catch (error) {
        console.error('🔥 DEBUG: Service call FAILED with error:', error);
        console.error('🔥 DEBUG: Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack
        });
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (result) => {
      console.log('🔥 DEBUG: Mutation onSuccess triggered with result:', result);
      toast.success('Location assigned successfully! Provider team has been created.');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-teams', provider.id] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-kpis', provider.id] });
      onLocationAssigned?.();
      setSelectedLocation('');
    },
    onError: (error: any) => {
      console.error('🔥 DEBUG: Mutation onError triggered with error:', error);
      console.error('🔥 DEBUG: Error message:', error?.message);
      console.error('🔥 DEBUG: Full error object:', error);
      toast.error(`Failed to assign location: ${error.message || 'Unknown error'}`);
    }
  });

  const removeLocationMutation = useMutation({
    mutationFn: async () => {
      console.log('🔥 DEBUG: Starting location removal');
      console.log('🔥 DEBUG: Provider ID:', provider.id);
      
      if (!provider.primary_location_id) {
        throw new Error('No location to remove');
      }
      
      try {
        console.log('🔥 DEBUG: Calling removeProviderFromLocation...');
        await providerRelationshipService.removeProviderFromLocation(provider.id, provider.primary_location_id);
        console.log('🔥 DEBUG: Location removal completed successfully');
      } catch (error) {
        console.error('🔥 DEBUG: Location removal FAILED:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('🔥 DEBUG: Location removal mutation succeeded');
      toast.success('Location assignment removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-teams', provider.id] });
      queryClient.invalidateQueries({ queryKey: ['provider-location-kpis', provider.id] });
      queryClient.invalidateQueries({ queryKey: ['unavailable-locations'] });
      onLocationAssigned?.();
    },
    onError: (error: any) => {
      console.error('🔥 DEBUG: Location removal mutation failed:', error);
      toast.error(`Failed to remove location: ${error.message || 'Unknown error'}`);
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

  const handleRemoveLocation = () => {
    if (!provider.primary_location_id) {
      toast.error('No location to remove');
      return;
    }
    removeLocationMutation.mutate();
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Currently Assigned</p>
                  <p className="text-sm text-green-600">{primaryLocationName || 'Unknown Location'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLocation}
                disabled={removeLocationMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {removeLocationMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
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
          
          <div className="flex gap-2">
            <Button
              onClick={handleAssignLocation}
              disabled={!selectedLocation || assignLocationMutation.isPending}
              className="flex-1"
            >
              {assignLocationMutation.isPending ? 'Assigning...' :
               provider.primary_location_id ? 'Change Location' : 'Assign Location'}
            </Button>
            
            {provider.primary_location_id && (
              <Button
                variant="outline"
                onClick={handleRemoveLocation}
                disabled={removeLocationMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {removeLocationMutation.isPending ? 'Clearing...' : 'Clear Location'}
              </Button>
            )}
          </div>
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
