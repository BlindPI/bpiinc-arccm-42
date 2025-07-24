import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { MonthlyAvailabilitySlot } from '@/types/availability';

interface UseMonthlyAvailabilityProps {
  startDate: Date;
  endDate: Date;
  userIds?: string[]; // For SA/AD to filter specific users
}

export function useMonthlyAvailability({ startDate, endDate, userIds }: UseMonthlyAvailabilityProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: monthlyAvailability = [], isLoading, error, refetch } = useQuery({
    queryKey: ['monthlyAvailability', startDate.toISOString(), endDate.toISOString(), userIds, user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id || !profile?.role) {
        console.log('🔧 useMonthlyAvailability: No user ID or role available');
        return [];
      }
      
      console.log('🔧 useMonthlyAvailability: Fetching availability for date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
      
      const { data, error } = await supabase.rpc('get_user_availability_for_date_range', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        user_ids: userIds || null,
        requesting_user_id: user.id,
        requesting_user_role: profile.role
      });

      if (error) {
        console.error('🔧 useMonthlyAvailability: Error fetching monthly availability:', error);
        throw error;
      }
      
      console.log('🔧 useMonthlyAvailability: Found availability slots:', data?.length || 0);
      return data as MonthlyAvailabilitySlot[];
    },
    enabled: !!user?.id && !!profile?.role && !!startDate && !!endDate,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  return {
    monthlyAvailability,
    isLoading,
    error,
    refetch,
    userRole: profile?.role,
  };
}

// Hook for getting users who have availability in a date range (for filtering dropdown)
export function useAvailableUsersInRange({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: availableUsers = [], isLoading, error } = useQuery({
    queryKey: ['availableUsersInRange', startDate.toISOString(), endDate.toISOString(), user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id || !profile?.role) return [];
      
      const { data, error } = await supabase.rpc('get_user_availability_for_date_range', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        user_ids: null, // Get all accessible users
        requesting_user_id: user.id,
        requesting_user_role: profile.role
      });

      if (error) throw error;

      // Extract unique users
      const userMap = new Map();
      data?.forEach((slot: any) => {
        if (!userMap.has(slot.user_id)) {
          userMap.set(slot.user_id, {
            user_id: slot.user_id,
            display_name: slot.display_name || 'Unknown User',
            email: slot.email || '',
            role: slot.role || ''
          });
        }
      });

      return Array.from(userMap.values()).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
    enabled: !!user?.id && !!profile?.role && !!startDate && !!endDate,
  });

  return {
    availableUsers,
    isLoading,
    error,
  };
}