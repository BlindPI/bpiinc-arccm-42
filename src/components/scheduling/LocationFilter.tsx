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
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('User not authenticated');

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.user.id)
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
          console.log('SA/AD user - all location IDs:', allowedLocationIds);
        } else if (userProfile?.role === 'AP') {
          // AP can only see assigned locations
          const { data: assignments, error } = await supabase
            .from('ap_user_location_assignments')
            .select('location_id')
            .eq('ap_user_id', user.user.id)
            .eq('status', 'active');
          
          if (error) throw error;
          allowedLocationIds = assignments?.map(a => a.location_id) || [];
          console.log('AP user - assigned location IDs:', allowedLocationIds);
        } else {
          // Other users can see locations where they are team members
          const { data: teamMembers, error } = await supabase
            .from('team_members')
            .select('teams!inner(location_id)')
            .eq('user_id', user.user.id)
            .eq('status', 'active');
          
          if (error) throw error;
          allowedLocationIds = teamMembers
            ?.map(member => (member.teams as any)?.location_id)
            .filter(Boolean) || [];
          console.log('Regular user - team location IDs:', allowedLocationIds);
        }

        if (allowedLocationIds.length === 0) {
          console.log('No allowed locations found');
          return [];
        }

        // Step 2: Get basic location data
        const { data: baseLocations, error: locationError } = await supabase
          .from('locations')
          .select('id, name, address')
          .in('id', allowedLocationIds)
          .eq('status', 'ACTIVE');

        if (locationError) throw locationError;
        console.log('Base locations:', baseLocations);

        if (!baseLocations || baseLocations.length === 0) {
          console.log('No active locations found');
          return [];
        }

        // Step 3: Get instructor counts for each location using proper joins
        const locationsWithCounts = await Promise.all(
          baseLocations.map(async (location) => {
            // First get teams for this location
            const { data: teams, error: teamsError } = await supabase
              .from('teams')
              .select('id')
              .eq('location_id', location.id);

            if (teamsError) {
              console.error('Error getting teams for location:', location.id, teamsError);
              return {
                id: location.id,
                name: location.name,
                address: location.address,
                instructorCount: 0
              };
            }

            if (!teams || teams.length === 0) {
              return {
                id: location.id,
                name: location.name,
                address: location.address,
                instructorCount: 0
              };
            }

            const teamIds = teams.map(t => t.id);

            // Then get instructor count for these teams
            const { data: instructorData, error: instructorError } = await supabase
              .from('team_members')
              .select(`
                profiles!inner(role)
              `)
              .in('team_id', teamIds)
              .eq('status', 'active')
              .in('profiles.role', ['IC', 'IP', 'IT']);

            if (instructorError) {
              console.error('Error getting instructors for location:', location.id, instructorError);
              return {
                id: location.id,
                name: location.name,
                address: location.address,
                instructorCount: 0
              };
            }

            const instructorCount = instructorData?.length || 0;
            console.log(`Location ${location.name} has ${instructorCount} instructors`);

            return {
              id: location.id,
              name: location.name,
              address: location.address,
              instructorCount
            };
          })
        );

        // For SA/AD users, show all locations regardless of instructor count
        // For others, only show locations with instructors
        const filteredLocations = userProfile?.role === 'SA' || userProfile?.role === 'AD' 
          ? locationsWithCounts 
          : locationsWithCounts.filter(location => location.instructorCount > 0);

        console.log('Final filtered locations:', filteredLocations);
        return filteredLocations;

      } catch (error) {
        console.error('Error in location filter query:', error);
        return [];
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