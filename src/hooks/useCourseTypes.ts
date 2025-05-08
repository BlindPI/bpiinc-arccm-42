
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CourseType, CourseTypeInsert } from '@/types/courses';

export function useCourseTypes() {
  const queryClient = useQueryClient();
  
  const { data: courseTypes = [], isLoading } = useQuery({
    queryKey: ['course-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_types')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching course types:', error);
        toast.error('Failed to load course types');
        throw error;
      }
      
      return data as CourseType[];
    }
  });

  const createCourseType = useMutation({
    mutationFn: async (newType: CourseTypeInsert) => {
      const { data, error } = await supabase
        .from('course_types')
        .insert([newType])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating course type:', error);
        if (error.code === '23505') {
          toast.error('A course type with this name already exists');
        } else {
          toast.error('Failed to create course type');
        }
        throw error;
      }
      
      return data as CourseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      toast.success('Course type created successfully');
    }
  });

  const updateCourseType = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseType> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating course type:', error);
        if (error.code === '23505') {
          toast.error('A course type with this name already exists');
        } else {
          toast.error('Failed to update course type');
        }
        throw error;
      }
      
      return data as CourseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      toast.success('Course type updated successfully');
    }
  });

  const toggleCourseTypeStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { data, error } = await supabase
        .from('course_types')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error toggling course type status:', error);
        toast.error('Failed to update course type status');
        throw error;
      }
      
      return data as CourseType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      toast.success(`Course type ${data.active ? 'activated' : 'deactivated'} successfully`);
    }
  });

  return {
    courseTypes,
    isLoading,
    createCourseType,
    updateCourseType,
    toggleCourseTypeStatus,
  };
}
