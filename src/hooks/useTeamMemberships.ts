
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
        console.log('🔧 useTeamMemberships: No user ID available');
        return [];
      }
      
      console.log('🔧 useTeamMemberships: Fetching teams for user ID:', user.id);
      
      try {
        // Use direct query with proper joins to get complete team membership data
        const { data: memberships, error } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            status,
            team_position,
            assignment_start_date,
            created_at,
            teams!team_members_team_id_fkey(
              id,
              name,
              description,
              team_type,
              status,
              locations!teams_location_id_fkey(
                id,
                name,
                address,
                city,
                state
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) {
          console.error('🔧 useTeamMemberships: Direct query failed:', error);
          return [];
        }

        console.log('🔧 useTeamMemberships: Direct query successful:', memberships?.length || 0, 'memberships');
        return memberships || [];

      } catch (exception) {
        console.error('🔧 useTeamMemberships: Exception in query:', exception);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      console.log(`🔧 useTeamMemberships: Query retry ${failureCount}:`, error);
      return failureCount < 2; // Retry up to 2 times
    },
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
