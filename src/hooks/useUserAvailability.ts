import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvailabilitySlot } from '@/types/availability';

export function useUserAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's availability schedule
  const { data: availability = [], isLoading, error } = useQuery({
    queryKey: ['userAvailability', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔧 useUserAvailability: No user ID available');
        return [];
      }
      
      console.log('🔧 useUserAvailability: Fetching availability for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('🔧 useUserAvailability: Error fetching availability:', error);
        throw error;
      }
      
      console.log('🔧 useUserAvailability: Found availability records:', data?.length || 0, data);
      return data as UserAvailabilitySlot[];
    },
    enabled: !!user?.id,
  });

  console.log('🔧 useUserAvailability: Hook result - availability:', availability?.length || 0, 'isLoading:', isLoading, 'error:', error);


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
    onSuccess: () => {
      console.log('🔧 saveAvailability: Invalidating queries');
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

  return {
    availability,
    isLoading,
    saveAvailability,
    deleteAvailability,
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