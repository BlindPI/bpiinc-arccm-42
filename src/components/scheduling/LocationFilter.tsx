import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LocationFilterProps {
  selectedLocationId?: string;
  onLocationChange: (locationId?: string) => void;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedLocationId,
  onLocationChange
}) => {
  const { data: locations } = useQuery({
    queryKey: ['locations-for-filtering'],
    queryFn: async () => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // If user is SA/AD, show all locations
      if (userProfile?.role === 'SA' || userProfile?.role === 'AD') {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, address')
          .eq('status', 'ACTIVE')
          .order('name');
        
        if (error) throw error;
        return data;
      }

      // If user is AP, show only assigned locations
      if (userProfile?.role === 'AP') {
        const { data, error } = await supabase
          .from('ap_user_location_assignments')
          .select(`
            location_id,
            locations!inner(id, name, address)
          `)
          .eq('ap_user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active')
          .eq('locations.status', 'ACTIVE');
        
        if (error) throw error;
        return data?.map(assignment => assignment.locations) || [];
      }

      // For other roles, show locations where they have teams
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!team_members_team_id_fkey(
            location_id
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const locationIds = teamMembers
        ?.map(member => member.teams?.location_id)
        .filter(Boolean) || [];
      
      if (locationIds.length === 0) return [];
      
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name, address')
        .in('id', locationIds)
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (locError) throw locError;
      return locations || [];
    }
  });

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLocationId || 'all'} onValueChange={(value) => onLocationChange(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select location..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations?.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};