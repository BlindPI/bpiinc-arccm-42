
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
      
      // Temporary fallback to prevent infinite recursion until RPC functions are available
      // This returns empty array to prevent the RLS recursion issue
      console.log('useTeamMemberships: Using safe fallback to prevent RLS recursion');
      console.log('useTeamMemberships: Returning empty array until RLS policies are fully resolved');
      return [];
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
