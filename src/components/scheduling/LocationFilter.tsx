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
    queryKey: ['locations-for-filtering-simple'],
    queryFn: async () => {
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        console.log('User profile:', userProfile);

        // Step 1: Get allowed location IDs based on user role
        let allowedLocationIds: string[] = [];

        if (userProfile?.role === 'SA' || userProfile?.role === 'AD') {
          // SA/AD can see all active locations
          const { data: allLocations, error } = await supabase
            .from('locations')
            .select('id')
            .eq('status', 'ACTIVE');
          
          if (error) throw error;
          allowedLocationIds = allLocations?.map(loc => loc.id) || [];
        } else if (userProfile?.role === 'AP') {
          // AP can only see assigned locations
          const { data: assignments, error } = await supabase
            .from('ap_user_location_assignments')
            .select('location_id')
            .eq('ap_user_id', (await supabase.auth.getUser()).data.user?.id)
            .eq('status', 'active');
          
          if (error) throw error;
          allowedLocationIds = assignments?.map(a => a.location_id) || [];
        } else {
          // Other users can see locations where they are team members
          const { data: teamMembers, error } = await supabase
            .from('team_members')
            .select(`
              teams!team_members_team_id_fkey(location_id)
            `)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .eq('status', 'active');
          
          if (error) throw error;
          allowedLocationIds = teamMembers
            ?.map(member => member.teams?.location_id)
            .filter(Boolean) || [];
        }

        console.log('Allowed location IDs:', allowedLocationIds);

        if (allowedLocationIds.length === 0) {
          return [];
        }

        // Step 2: Get locations with their instructor counts
        const { data: locationsWithTeams, error: locationError } = await supabase
          .from('locations')
          .select(`
            id, name, address,
            teams!teams_location_id_fkey(
              id,
              team_members!team_members_team_id_fkey(
                user_id,
                profiles!team_members_user_id_fkey(role)
              )
            )
          `)
          .in('id', allowedLocationIds)
          .eq('status', 'ACTIVE');

        if (locationError) throw locationError;

        console.log('Locations with teams:', locationsWithTeams);

        // Step 3: Calculate instructor counts and filter locations with instructors
        const locationsWithInstructors = locationsWithTeams?.map(location => {
          const instructorCount = location.teams?.reduce((count, team) => {
            return count + (team.team_members?.filter((member: any) => 
              member.profiles?.role && ['IC', 'IP', 'IT'].includes(member.profiles.role)
            ).length || 0);
          }, 0) || 0;

          return {
            id: location.id,
            name: location.name,
            address: location.address,
            instructorCount
          };
        }).filter(location => location.instructorCount > 0) || [];

        console.log('Final filtered locations:', locationsWithInstructors);
        return locationsWithInstructors;

      } catch (error) {
        console.error('Error in location filter query:', error);
        throw error;
      }
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
          {locations?.map((location: any) => (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex items-center justify-between w-full">
                <span>{location.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {location.instructorCount} instructor{location.instructorCount !== 1 ? 's' : ''}
                </span>
              </div>
            </SelectItem>
          ))}
          {(!locations || locations.length === 0) && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              No locations with available instructors
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};