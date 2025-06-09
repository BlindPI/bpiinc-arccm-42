
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Location } from '@/types/supabase-schema';

export default function LocationTable() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Map database properties to unified interface
      return (data || []).map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        postal_code: location.postal_code || location.zip,
        country: location.country,
        email: location.email,
        phone: location.phone,
        website: location.website,
        logo_url: location.logo_url,
        status: location.status as 'ACTIVE' | 'INACTIVE',
        created_at: location.created_at,
        updated_at: location.updated_at
      }));
    }
  });

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading locations...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading locations: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations
          </CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations found
            </div>
          ) : (
            filteredLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{location.name}</h3>
                  <p className="text-sm text-gray-600">
                    {[location.address, location.city, location.state, location.postal_code].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={location.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {location.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { LocationTable };
