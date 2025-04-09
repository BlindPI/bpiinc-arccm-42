
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseOffering } from '@/types/courses';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCourseOfferings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const offeringsQuery = useQuery({
    queryKey: ['course_offerings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          *,
          courses:course_id(name, description),
          locations:location_id(name, address, city, state),
          instructors:instructor_id(display_name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as (CourseOffering & {
        courses: { name: string; description: string | null };
        locations: { name: string; address: string | null; city: string | null; state: string | null };
        instructors: { display_name: string | null } | null;
      })[];
    },
    enabled: !!user
  });

  const createOffering = useMutation({
    mutationFn: async (newOffering: Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('course_offerings')
        .insert([newOffering])
        .select()
        .single();
      
      if (error) throw error;
      return data as CourseOffering;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_offerings'] });
      toast.success('Course offering created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create course offering: ${error.message}`);
    }
  });

  const updateOffering = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseOffering> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_offerings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CourseOffering;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_offerings'] });
      toast.success('Course offering updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update course offering: ${error.message}`);
    }
  });

  return {
    data: offeringsQuery.data || [],
    isLoading: offeringsQuery.isLoading,
    error: offeringsQuery.error,
    createOffering,
    updateOffering
  };
}
