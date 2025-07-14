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
    queryKey: ['locations-for-filtering-with-instructors'],
    queryFn: async () => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Get locations with instructor availability
      const getLocationsWithInstructors = async (locationIds?: string[]) => {
        let locQuery = supabase
          .from('locations')
          .select(`
            id, name, address,
            teams!teams_location_id_fkey(
              id,
              team_members!team_members_team_id_fkey(
                user_id,
                status,
                profiles!team_members_user_id_fkey(
                  id, role, display_name,
                  user_availability(day_of_week, start_time, end_time)
                )
              )
            )
          `)
          .eq('status', 'ACTIVE')
          .eq('teams.team_members.status', 'active')
          .in('teams.team_members.profiles.role', ['IC', 'IP', 'IT']);

        if (locationIds) {
          locQuery = locQuery.in('id', locationIds);
        }

        const { data: locationsData, error } = await locQuery;
        if (error) throw error;

        // Filter locations that have at least one instructor with availability
        return locationsData?.filter(location => {
          const hasInstructors = location.teams?.some((team: any) => 
            team.team_members?.some((member: any) => 
              member.profiles?.role && ['IC', 'IP', 'IT'].includes(member.profiles.role) &&
              member.profiles.user_availability?.length > 0
            )
          );
          return hasInstructors;
        }).map(location => ({
          id: location.id,
          name: location.name,
          address: location.address,
          instructorCount: location.teams?.reduce((count: number, team: any) => 
            count + (team.team_members?.filter((member: any) => 
              member.profiles?.role && ['IC', 'IP', 'IT'].includes(member.profiles.role) &&
              member.profiles.user_availability?.length > 0
            ).length || 0), 0
          ) || 0
        })) || [];
      };

      // If user is SA/AD, show all locations with instructors
      if (userProfile?.role === 'SA' || userProfile?.role === 'AD') {
        return await getLocationsWithInstructors();
      }

      // If user is AP, show only assigned locations with instructors
      if (userProfile?.role === 'AP') {
        const { data: assignments, error } = await supabase
          .from('ap_user_location_assignments')
          .select('location_id')
          .eq('ap_user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active');
        
        if (error) throw error;
        const assignedLocationIds = assignments?.map(a => a.location_id) || [];
        
        if (assignedLocationIds.length === 0) return [];
        return await getLocationsWithInstructors(assignedLocationIds);
      }

      // For other roles, show locations where they have teams with instructors
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!team_members_team_id_fkey(location_id)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const locationIds = teamMembers
        ?.map(member => member.teams?.location_id)
        .filter(Boolean) || [];
      
      if (locationIds.length === 0) return [];
      return await getLocationsWithInstructors(locationIds);
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