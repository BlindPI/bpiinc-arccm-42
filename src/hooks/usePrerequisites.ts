
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CoursePrerequisite } from '@/types/courses';

export function usePrerequisites() {
  const queryClient = useQueryClient();
  
  const { data: prerequisites = [], isLoading } = useQuery({
    queryKey: ['prerequisites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching prerequisites:', error);
        toast.error('Failed to load course prerequisites');
        throw error;
      }
      
      return data as CoursePrerequisite[];
    }
  });

  const createPrerequisite = useMutation({
    mutationFn: async (newPrereq: Omit<CoursePrerequisite, 'id' | 'created_at' | 'updated_at'>) => {
      // Check if this prerequisite already exists
      const { data: existing } = await supabase
        .from('course_prerequisites')
        .select('*')
        .eq('course_id', newPrereq.course_id)
        .eq('prerequisite_course_id', newPrereq.prerequisite_course_id)
        .maybeSingle();
      
      if (existing) {
        toast.error('This prerequisite relationship already exists');
        throw new Error('Duplicate prerequisite relationship');
      }
      
      const { data, error } = await supabase
        .from('course_prerequisites')
        .insert([newPrereq])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating prerequisite:', error);
        toast.error('Failed to create prerequisite relationship');
        throw error;
      }
      
      return data as CoursePrerequisite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites'] });
      toast.success('Prerequisite created successfully');
    }
  });

  const updatePrerequisite = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CoursePrerequisite> & { id: string }) => {
      // Check for duplicate if course_id or prerequisite_course_id is being updated
      if (updates.course_id || updates.prerequisite_course_id) {
        const { data: existing } = await supabase
          .from('course_prerequisites')
          .select('*')
          .eq('course_id', updates.course_id || '')
          .eq('prerequisite_course_id', updates.prerequisite_course_id || '')
          .not('id', 'eq', id)
          .maybeSingle();
        
        if (existing) {
          toast.error('This prerequisite relationship already exists');
          throw new Error('Duplicate prerequisite relationship');
        }
      }
      
      const { data, error } = await supabase
        .from('course_prerequisites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating prerequisite:', error);
        toast.error('Failed to update prerequisite relationship');
        throw error;
      }
      
      return data as CoursePrerequisite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites'] });
      toast.success('Prerequisite updated successfully');
    }
  });

  const deletePrerequisite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_prerequisites')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting prerequisite:', error);
        toast.error('Failed to delete prerequisite relationship');
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites'] });
      toast.success('Prerequisite deleted successfully');
    }
  });

  return {
    prerequisites,
    isLoading,
    createPrerequisite,
    updatePrerequisite,
    deletePrerequisite
  };
}
