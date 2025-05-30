
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTeamMemberships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['team-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useTeamMemberships: No user ID available');
        return [];
      }
      
      console.log('useTeamMemberships: Fetching teams for user ID:', user.id);
      
      // Use a simpler approach with manual joins to avoid relationship ambiguity
      const { data: teamMemberships, error: memberError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          location_assignment,
          assignment_start_date,
          assignment_end_date,
          team_position,
          permissions,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id);

      console.log('useTeamMemberships: Team memberships result:', { data: teamMemberships, error: memberError });

      if (memberError) {
        console.error('useTeamMemberships: Database error:', memberError);
        throw memberError;
      }

      if (!teamMemberships || teamMemberships.length === 0) {
        console.log('useTeamMemberships: No team memberships found');
        return [];
      }

      // Fetch teams separately
      const teamIds = teamMemberships.map(tm => tm.team_id);
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          team_type,
          status,
          performance_score,
          location_id,
          locations(
            id,
            name
          )
        `)
        .in('id', teamIds);

      console.log('useTeamMemberships: Teams result:', { data: teams, error: teamsError });

      if (teamsError) {
        console.error('useTeamMemberships: Teams fetch error:', teamsError);
        throw teamsError;
      }

      // Combine the data manually
      const result = teamMemberships.map(membership => ({
        ...membership,
        teams: teams?.find(team => team.id === membership.team_id) || null
      }));
      
      console.log('useTeamMemberships: Final result:', result);
      return result;
    },
    enabled: !!user?.id
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('useTeamMemberships: Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel('team_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('useTeamMemberships: Real-time change received:', payload);
          // Invalidate and refetch the query
          queryClient.invalidateQueries({ queryKey: ['team-memberships', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('useTeamMemberships: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}
