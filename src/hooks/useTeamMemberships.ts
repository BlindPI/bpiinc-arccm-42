
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
      
      // Use explicit join with foreign key reference to avoid ambiguity
      const { data, error } = await supabase
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
          updated_at,
          teams!fk_team_members_team_id(
            id,
            name,
            description,
            team_type,
            status,
            performance_score,
            location_id,
            locations!fk_teams_location_id(
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id);

      console.log('useTeamMemberships: Query result:', { data, error });

      if (error) {
        console.error('useTeamMemberships: Database error:', error);
        throw error;
      }
      
      console.log('useTeamMemberships: Returning teams:', data || []);
      return data || [];
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
