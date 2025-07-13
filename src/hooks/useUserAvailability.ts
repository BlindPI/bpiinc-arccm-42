import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type UserAvailability = Database['public']['Tables']['user_availability']['Row'];
type AvailabilityInsert = Database['public']['Tables']['user_availability']['Insert'];
type AvailabilityUpdate = Database['public']['Tables']['user_availability']['Update'];
type AvailabilityException = Database['public']['Tables']['availability_exceptions']['Row'];
type AvailabilityBooking = Database['public']['Tables']['availability_bookings']['Row'];

export function useUserAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's availability schedule
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['userAvailability', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as UserAvailability[];
    },
    enabled: !!user?.id,
  });

  // Get availability exceptions
  const { data: exceptions = [] } = useQuery({
    queryKey: ['availabilityExceptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('exception_date', new Date().toISOString().split('T')[0])
        .order('exception_date', { ascending: true });

      if (error) throw error;
      return data as AvailabilityException[];
    },
    enabled: !!user?.id,
  });

  // Get upcoming bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['availabilityBookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('availability_bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as AvailabilityBooking[];
    },
    enabled: !!user?.id,
  });

  // Create or update availability
  const saveAvailability = useMutation({
    mutationFn: async (availabilityData: AvailabilityInsert | AvailabilityUpdate) => {
      if ('id' in availabilityData && availabilityData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('user_availability')
          .update(availabilityData)
          .eq('id', availabilityData.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('user_availability')
          .insert({
            ...availabilityData as Omit<AvailabilityInsert, 'user_id'>,
            user_id: user?.id!
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
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
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
    },
  });

  // Add availability exception
  const addException = useMutation({
    mutationFn: async (exception: Omit<AvailabilityException, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .insert({
          ...exception,
          user_id: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilityExceptions'] });
    },
  });

  return {
    availability,
    exceptions,
    bookings,
    isLoading,
    saveAvailability,
    deleteAvailability,
    addException,
  };
}

export function useTeamAvailability(teamId?: string) {
  const queryClient = useQueryClient();

  // Get team member availability (for managers)
  const { data: teamAvailability = [], isLoading } = useQuery({
    queryKey: ['teamAvailability', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('user_availability')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            role
          )
        `)
        .eq('is_active', true)
        .in('user_id', 
          // Get team member IDs
          await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)
            .eq('status', 'active')
            .then(({ data }) => data?.map(m => m.user_id) || [])
        );

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  return {
    teamAvailability,
    isLoading,
  };
}