import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamFilterProps {
  selectedTeamId?: string;
  onTeamChange: (teamId?: string) => void;
  locationId?: string;
}

export const TeamFilter: React.FC<TeamFilterProps> = ({
  selectedTeamId,
  onTeamChange,
  locationId
}) => {
  const { data: teams } = useQuery({
    queryKey: ['teams-for-filtering', locationId],
    queryFn: async () => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let query = supabase
        .from('teams')
        .select('id, name, team_type, location_id')
        .eq('status', 'active')
        .order('name');

      // Filter by location if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      // If user is SA/AD, show all teams (with location filter if provided)
      if (userProfile?.role === 'SA' || userProfile?.role === 'AD') {
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      // If user is AP, show teams only in their assigned locations
      if (userProfile?.role === 'AP') {
        const { data: assignments } = await supabase
          .from('ap_user_location_assignments')
          .select('location_id')
          .eq('ap_user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active');

        const assignedLocationIds = assignments?.map(a => a.location_id) || [];
        if (assignedLocationIds.length === 0) return [];

        // Apply both AP location restriction and optional location filter
        if (locationId) {
          if (!assignedLocationIds.includes(locationId)) return [];
          query = query.eq('location_id', locationId);
        } else {
          query = query.in('location_id', assignedLocationIds);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      // For other roles, show only teams they are members of
      const { data: memberTeams, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!team_members_team_id_fkey(id, name, team_type, location_id)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');

      if (error) throw error;

      let userTeams = memberTeams?.map(member => member.teams).filter(Boolean) || [];

      // Apply location filter if provided
      if (locationId) {
        userTeams = userTeams.filter(team => team?.location_id === locationId);
      }

      return userTeams;
    }
  });

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTeamId || 'all'} onValueChange={(value) => onTeamChange(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams?.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} ({team.team_type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};