
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Course } from '@/types/courses';
import { PostgrestError } from '@supabase/supabase-js';
import { useProfile } from '@/hooks/useProfile';

export interface CourseUpdateData {
  name?: string;
  code?: string; // Added code field
  description?: string;
  expiration_months?: number;
  course_type_id?: string | null;
  length?: number | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  reason?: string; // New field for audit logging
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // Check if user has permission to update courses
  const hasPermission = profile?.role && ['SA', 'AD'].includes(profile.role);

  return useMutation({
    mutationFn: async ({ id, reason, ...data }: CourseUpdateData & { id: string }) => {
      // If user doesn't have permission, throw early
      if (!hasPermission) {
        throw new Error('You do not have permission to update courses');
      }

      const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      // If reason provided, log it separately
      if (reason) {
        try {
          await supabase.rpc('log_course_action', {
            course_id: id,
            action_type: 'UPDATE_WITH_REASON',
            changes: null,
            reason_text: reason
          });
        } catch (e) {
          console.error('Failed to log update reason:', e);
          // Don't fail the entire operation if just the reason logging fails
        }
      }
      
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
      } else if (postgrestError?.code === '42501') {
        toast.error('You do not have permission to update courses');
      } else if (!hasPermission) {
        toast.error('You do not have permission to update courses');
      } else {
        toast.error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });
}

export function useToggleCourseStatus() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // Check if user has permission
  const hasPermission = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: 'ACTIVE' | 'INACTIVE', reason?: string }) => {
      // If user doesn't have permission, throw early
      if (!hasPermission) {
        throw new Error('You do not have permission to update course status');
      }
      
      const { error } = await supabase
        .from('courses')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      
      // If reason provided, log it separately
      if (reason) {
        try {
          await supabase.rpc('log_course_action', {
            course_id: id,
            action_type: status === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE',
            changes: null,
            reason_text: reason
          });
        } catch (e) {
          console.error('Failed to log status change reason:', e);
        }
      }
      
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`Course ${data.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Error toggling course status:', error);
      
      if (!hasPermission) {
        toast.error('You do not have permission to update course status');
      } else {
        toast.error('Failed to update course status');
      }
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // Check if user has permission
  const hasPermission = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason?: string }) => {
      // If user doesn't have permission, throw early
      if (!hasPermission) {
        throw new Error('You do not have permission to delete courses');
      }
      
      // Log reason before deletion if provided
      if (reason) {
        try {
          await supabase.rpc('log_course_action', {
            course_id: id,
            action_type: 'DELETE_WITH_REASON',
            changes: null,
            reason_text: reason
          });
        } catch (e) {
          console.error('Failed to log deletion reason:', e);
        }
      }
      
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
    onError: (error: Error | PostgrestError) => {
      console.error('Error deleting course:', error);
      
      if (!hasPermission) {
        toast.error('You do not have permission to delete courses');
      } else {
        toast.error('Failed to delete course');
      }
    }
  });
}
