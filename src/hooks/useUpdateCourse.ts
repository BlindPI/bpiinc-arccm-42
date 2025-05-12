
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Course } from '@/types/courses';
import { PostgrestError } from '@supabase/supabase-js';

export interface CourseUpdateData {
  name?: string;
  description?: string;
  expiration_months?: number;
  course_type_id?: string | null;
  length?: number | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: CourseUpdateData & { id: string }) => {
      const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      return { id, ...data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      console.log('Course updated:', data);
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Error updating course:', error);
      
      const postgrestError = error as PostgrestError;
      
      if (postgrestError?.code === '23505') {
        toast.error('A course with this name already exists');
      } else {
        toast.error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });
}

export function useToggleCourseStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'ACTIVE' | 'INACTIVE' }) => {
      const { error } = await supabase
        .from('courses')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`Course ${data.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error) => {
      console.error('Error toggling course status:', error);
      toast.error('Failed to update course status');
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Log deletion attempt
      console.log(`Attempting to delete course with ID: ${id}`);
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
      console.log(`Course ${id} deleted successfully`);
    },
    onError: (error) => {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  });
}
