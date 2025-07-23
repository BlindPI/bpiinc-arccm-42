import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { UserAvailabilitySlot, AvailabilityUser } from '@/types/availability';

export function useUserAvailability() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  // Enhanced availability query that handles role-based access
  const { data: availability = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userAvailability', user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔧 useUserAvailability: No user ID available');
        return [];
      }
      
      console.log('🔧 useUserAvailability: Fetching availability for user:', user.id, 'role:', profile?.role);
      
      // For IC, IP, IT, IN users - only fetch their own availability
      if (!profile?.role || ['IC', 'IP', 'IT', 'IN'].includes(profile.role)) {
        const { data, error } = await supabase
          .from('user_availability')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('🔧 useUserAvailability: Error fetching own availability:', error);
          throw error;
        }
        
        console.log('🔧 useUserAvailability: Found own availability records:', data?.length || 0);
        return data as UserAvailabilitySlot[];
      }

      // For SA/AD users - can access all availability
      if (profile.role === 'SA' || profile.role === 'AD') {
        const { data, error } = await supabase
          .from('user_availability')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              email,
              role
            )
          `)
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('🔧 useUserAvailability: Error fetching all availability:', error);
          throw error;
        }
        
        console.log('🔧 useUserAvailability: Found all availability records:', data?.length || 0);
        return data as UserAvailabilitySlot[];
      }

      // For AP users - fetch team member availability
      if (profile.role === 'AP') {
        // Get accessible team members using the database function
        const { data: accessibleUsers, error: accessError } = await supabase
          .rpc('get_ap_team_availability_access', { ap_user_id: user.id });

        if (accessError) {
          console.error('🔧 useUserAvailability: Error fetching accessible users:', accessError);
          throw accessError;
        }

        console.log('🔧 useUserAvailability: Accessible users for AP:', accessibleUsers?.length || 0);

        if (!accessibleUsers || accessibleUsers.length === 0) {
          // Fall back to own availability if no team access
          const { data, error } = await supabase
            .from('user_availability')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

          if (error) {
            console.error('🔧 useUserAvailability: Error fetching fallback availability:', error);
            throw error;
          }
          
          return data as UserAvailabilitySlot[];
        }

        // Get availability for accessible users
        const userIds = accessibleUsers.map(u => u.user_id);
        const { data: teamAvailability, error: teamError } = await supabase
          .from('user_availability')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              email,
              role
            )
          `)
          .in('user_id', userIds)
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (teamError) {
          console.error('🔧 useUserAvailability: Error fetching team availability:', teamError);
          throw teamError;
        }

        console.log('🔧 useUserAvailability: Found team availability records:', teamAvailability?.length || 0);
        return teamAvailability as UserAvailabilitySlot[];
      }

      // Default fallback - own availability only
      const { data, error } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('🔧 useUserAvailability: Error fetching default availability:', error);
        throw error;
      }
      
      console.log('🔧 useUserAvailability: Found default availability records:', data?.length || 0);
      return data as UserAvailabilitySlot[];
    },
    enabled: !!user?.id && !!profile?.role,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  console.log('🔧 useUserAvailability: Hook result - availability:', availability?.length || 0, 'isLoading:', isLoading, 'error:', error, 'role:', profile?.role);


  // Create or update availability
  const saveAvailability = useMutation({
    mutationFn: async (availabilityData: any) => {
      console.log('🔧 saveAvailability: Saving data:', availabilityData);
      
      if (availabilityData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('user_availability')
          .update(availabilityData)
          .eq('id', availabilityData.id)
          .select()
          .single();
        
        if (error) {
          console.error('🔧 saveAvailability: Update error:', error);
          throw error;
        }
        console.log('🔧 saveAvailability: Updated successfully:', data);
        return data;
      } else {
        // Create new
        const insertData = {
          user_id: user?.id!,
          day_of_week: availabilityData.day_of_week,
          start_time: availabilityData.start_time,
          end_time: availabilityData.end_time,
          availability_type: availabilityData.availability_type,
          recurring_pattern: availabilityData.recurring_pattern || 'weekly',
          effective_date: availabilityData.effective_date,
          expiry_date: availabilityData.expiry_date,
          time_slot_duration: availabilityData.time_slot_duration || 60,
          notes: availabilityData.notes,
          is_active: true
        };
        
        console.log('🔧 saveAvailability: Inserting data:', insertData);
        
        const { data, error } = await supabase
          .from('user_availability')
          .insert(insertData)
          .select()
          .single();
        
        if (error) {
          console.error('🔧 saveAvailability: Insert error:', error);
          throw error;
        }
        console.log('🔧 saveAvailability: Inserted successfully:', data);
        return data;
      }
    },
    onSuccess: (data) => {
      console.log('🔧 saveAvailability: Successfully saved, invalidating queries. Saved data:', data);
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
      // Force refetch to ensure latest data
      refetch();
    },
  });

  // Delete availability
  const deleteAvailability = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_availability')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('🔧 deleteAvailability: Successfully deleted, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
      // Force refetch to ensure latest data
      refetch();
    },
  });

  // Helper function to check if current user can edit specific availability
  const canEditAvailability = (availabilityUserId: string) => {
    if (!profile?.role || !user?.id) return false;
    
    // Users can always edit their own
    if (availabilityUserId === user.id) return true;
    
    // SA/AD can edit all
    if (['SA', 'AD'].includes(profile.role)) return true;
    
    // AP users might be able to edit team members (based on permissions)
    // This would need to be checked against the permission tables
    return false;
  };

  return {
    availability,
    isLoading,
    error,
    saveAvailability,
    deleteAvailability,
    refetch,
    canEditAvailability,
    userRole: profile?.role,
  };
}

// Dedicated hook for AP users to manage team availability
export function useTeamAvailability(teamId?: string) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  // Get team member availability with enhanced data for management view
  const { data: teamAvailability = [], isLoading, error } = useQuery({
    queryKey: ['teamAvailability', teamId, user?.id],
    queryFn: async () => {
      if (!teamId || !user?.id) return [];
      
      console.log('🔧 useTeamAvailability: Fetching team availability for team:', teamId);
      
      // Get team members with their availability
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          status,
          role,
          profiles:user_id (
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (membersError) {
        console.error('🔧 useTeamAvailability: Error fetching team members:', membersError);
        throw membersError;
      }

      if (!teamMembers || teamMembers.length === 0) {
        console.log('🔧 useTeamAvailability: No team members found');
        return [];
      }

      const memberIds = teamMembers.map(m => m.user_id);
      
      // Get availability for all team members
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('user_availability')
        .select('*')
        .in('user_id', memberIds)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (availabilityError) {
        console.error('🔧 useTeamAvailability: Error fetching availability:', availabilityError);
        throw availabilityError;
      }

      // Organize availability by user
      const result: AvailabilityUser[] = teamMembers.map(member => ({
        user_id: member.user_id,
        display_name: member.profiles?.display_name || 'Unknown',
        email: member.profiles?.email || '',
        role: member.profiles?.role || '',
        availability_slots: availabilityData?.filter(slot => slot.user_id === member.user_id) || []
      }));

      console.log('🔧 useTeamAvailability: Organized team availability for', result.length, 'members');
      return result;
    },
    enabled: !!teamId && !!user?.id && profile?.role === 'AP',
    retry: 3,
    refetchOnWindowFocus: false,
  });

  // Get teams that the current AP user can manage
  const { data: managedTeams = [] } = useQuery({
    queryKey: ['apManagedTeams', user?.id],
    queryFn: async () => {
      if (!user?.id || profile?.role !== 'AP') return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data?.map(tm => tm.teams).filter(Boolean) || [];
    },
    enabled: !!user?.id && profile?.role === 'AP',
  });

  return {
    teamAvailability,
    managedTeams,
    isLoading,
    error,
  };
}

// Hook for getting availability data grouped by user (for management interfaces)
export function useAvailabilityByUser() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: availabilityByUser = [], isLoading, error } = useQuery({
    queryKey: ['availabilityByUser', user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id) return [];

      let query;
      
      // Role-based data fetching
      if (profile?.role === 'AP') {
        // AP users: get team members they can access
        const { data: accessibleUsers, error: accessError } = await supabase
          .rpc('get_ap_team_availability_access', { ap_user_id: user.id });

        if (accessError) throw accessError;
        if (!accessibleUsers || accessibleUsers.length === 0) return [];

        const userIds = accessibleUsers.map(u => u.user_id);
        query = supabase
          .from('user_availability')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              email,
              role
            )
          `)
          .in('user_id', userIds)
          .eq('is_active', true);
      } else if (['SA', 'AD'].includes(profile?.role || '')) {
        // SA/AD users: get all availability
        query = supabase
          .from('user_availability')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              email,
              role
            )
          `)
          .eq('is_active', true);
      } else {
        // IC/IP/IT/IN users: only their own availability
        query = supabase
          .from('user_availability')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              email,
              role
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      const { data, error } = await query.order('day_of_week', { ascending: true })
                                         .order('start_time', { ascending: true });

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, AvailabilityUser>();
      
      data?.forEach((slot: any) => {
        const userId = slot.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            display_name: slot.profiles?.display_name || 'Unknown',
            email: slot.profiles?.email || '',
            role: slot.profiles?.role || '',
            availability_slots: []
          });
        }
        userMap.get(userId)!.availability_slots.push(slot);
      });

      return Array.from(userMap.values()).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
    enabled: !!user?.id && !!profile?.role,
  });

  return {
    availabilityByUser,
    isLoading,
    error,
  };
}