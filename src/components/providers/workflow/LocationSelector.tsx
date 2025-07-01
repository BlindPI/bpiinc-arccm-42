
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Building } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
}

interface LocationSelectorProps {
  selectedLocationId?: string;
  onSelect: (locationId: string) => void;
  excludeAssigned?: boolean;
}

export function LocationSelector({ selectedLocationId, onSelect, excludeAssigned = false }: LocationSelectorProps) {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')  // Only get ACTIVE locations
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    }
  });

  const { data: assignedLocationIds = [] } = useQuery({
    queryKey: ['locations-assigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('primary_location_id')
        .not('primary_location_id', 'is', null);
      
      if (error) throw error;
      return data.map(p => p.primary_location_id).filter(Boolean);
    },
    enabled: excludeAssigned
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading locations...</div>
      </div>
    );
  }

  const availableLocations = excludeAssigned 
    ? locations.filter(loc => !assignedLocationIds.includes(loc.id))
    : locations;
  
  const assignedLocations = excludeAssigned 
    ? locations.filter(loc => assignedLocationIds.includes(loc.id))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Location</h3>
        <p className="text-muted-foreground">
          Choose the location where this authorized provider will operate.
        </p>
      </div>

      {/* Available Locations */}
      <div className="space-y-4">
        <h4 className="font-medium text-blue-700 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Available Locations ({availableLocations.length})
        </h4>
        
        {availableLocations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available locations found</p>
              <p className="text-sm">All locations may already have assigned providers</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {availableLocations.map((location) => (
              <Card
                key={location.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedLocationId === location.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(location.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        {(location.city || location.state) && (
                          <p className="text-sm text-muted-foreground">
                            {[location.city, location.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {location.address && (
                          <p className="text-xs text-muted-foreground mt-1">{location.address}</p>
                        )}
                      </div>
                    </div>
                    
                    {selectedLocationId === location.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Already Assigned Locations (for reference) */}
      {assignedLocations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-amber-700 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Already Assigned Locations ({assignedLocations.length})
          </h4>
          
          <div className="grid gap-2">
            {assignedLocations.map((location) => (
              <Card key={location.id} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{location.name}</div>
                        {(location.city || location.state) && (
                          <div className="text-xs text-muted-foreground">
                            {[location.city, location.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Has Provider</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
