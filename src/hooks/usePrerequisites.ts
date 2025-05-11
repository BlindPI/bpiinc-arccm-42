
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CoursePrerequisite } from '@/types/courses';
import { toast } from 'sonner';

export function usePrerequisites(courseId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['prerequisites', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .select(`
          *,
          prerequisite_course:prerequisite_course_id(id, name)
        `)
        .eq('course_id', courseId)
        .order('created_at');
      
      if (error) {
        console.error('Error fetching prerequisites:', error);
        throw error;
      }
      
      return data || []; // Ensure we always return an array, even if data is null
    },
    enabled: !!courseId,
  });

  const createPrerequisite = useMutation({
    mutationFn: async ({ 
      courseId, 
      prerequisiteCourseId, 
      isRequired = true 
    }: { 
      courseId: string; 
      prerequisiteCourseId: string; 
      isRequired?: boolean;
    }) => {
      const prereq = {
        course_id: courseId,
        prerequisite_course_id: prerequisiteCourseId,
        is_required: isRequired
      };

      const { data, error } = await supabase
        .from('course_prerequisites')
        .insert([prereq])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating prerequisite:', error);
        toast.error('Failed to add prerequisite');
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Prerequisite added successfully');
    },
  });

  const updatePrerequisite = useMutation({
    mutationFn: async ({ 
      id, 
      courseId: course_id, 
      prerequisiteCourseId: prerequisite_course_id, 
      isRequired: is_required 
    }: { 
      id: string; 
      courseId: string; 
      prerequisiteCourseId: string; 
      isRequired: boolean;
    }) => {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .update({
          course_id,
          prerequisite_course_id,
          is_required
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating prerequisite:', error);
        toast.error('Failed to update prerequisite');
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Prerequisite updated successfully');
    },
  });

  const deletePrerequisite = useMutation({
    mutationFn: async (prerequisiteId: string) => {
      const { error } = await supabase
        .from('course_prerequisites')
        .delete()
        .eq('id', prerequisiteId);
      
      if (error) {
        console.error('Error deleting prerequisite:', error);
        toast.error('Failed to remove prerequisite');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Prerequisite removed successfully');
    },
  });

  return {
    prerequisites: data || [], // Ensure prerequisites is always an array
    isLoading,
    createPrerequisite,
    updatePrerequisite,
    deletePrerequisite,
  };
}
