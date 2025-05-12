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
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
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
      
      // Instead of using DELETED status (which isn't allowed by DB constraint),
      // mark as INACTIVE with a special audit log to indicate deletion
      const { error } = await supabase
        .from('courses')
        .update({ status: 'INACTIVE' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Log the soft delete action with reason
      try {
        await supabase.rpc('log_course_action', {
          course_id: id,
          action_type: 'SOFT_DELETE',
          changes: null,
          reason_text: reason || 'Course marked as deleted'
        });
      } catch (e) {
        console.error('Failed to log deletion reason:', e);
        // Don't fail the operation if just the logging fails
      }
      
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

export function useHardDeleteCourse() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // Only system administrators can permanently delete courses
  const hasPermission = profile?.role === 'SA';
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason?: string }) => {
      // Only allow System Administrators to perform hard deletes
      if (!hasPermission) {
        throw new Error('Only system administrators can permanently delete courses');
      }
      
      try {
        // Use the database function directly which now handles the logging properly
        const { data, error } = await supabase.rpc('permanently_delete_course', {
          course_id: id,
          reason_text: reason || 'Course permanently deleted'
        });
        
        if (error) {
          throw error;
        }
        
        return id;
      } catch (error) {
        console.error('Error in hard delete course:', error);
        throw error;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course permanently deleted');
      console.log(`Course ${id} permanently deleted`);
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Error permanently deleting course:', error);
      
      if (!hasPermission) {
        toast.error('Only system administrators can permanently delete courses');
      } else {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        toast.error(`Failed to permanently delete course: ${errorMessage}`);
      }
    }
  });
}

export function useHardDeleteAllCourses() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // Only system administrators can permanently delete courses
  const hasPermission = profile?.role === 'SA';
  
  return useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      // Only allow System Administrators to perform hard deletes
      if (!hasPermission) {
        throw new Error('Only system administrators can permanently delete courses');
      }
      
      // First get all soft-deleted courses
      const { data: softDeletedCourses, error: fetchError } = await supabase
        .from('course_audit_logs')
        .select('course_id')
        .eq('action', 'SOFT_DELETE')
        .not('course_id', 'is', null); // Only select logs with valid course IDs
      
      if (fetchError) throw fetchError;
      
      if (!softDeletedCourses || softDeletedCourses.length === 0) {
        return { count: 0, message: 'No soft-deleted courses found' };
      }
      
      // Process each course for permanent deletion
      let successCount = 0;
      let errorCount = 0;
      
      for (const course of softDeletedCourses) {
        if (!course.course_id) continue;
        
        // Verify the course still exists
        const { data: courseExists, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', course.course_id)
          .maybeSingle();
          
        if (checkError || !courseExists) {
          console.log(`Course ${course.course_id} already deleted or not found`);
          continue;
        }
        
        try {
          // Use our database function directly
          const { error } = await supabase.rpc('permanently_delete_course', {
            course_id: course.course_id,
            reason_text: reason
          });
          
          if (error) {
            errorCount++;
            console.error(`Error deleting course ${course.course_id}:`, error);
          } else {
            successCount++;
            console.log(`Successfully deleted course ${course.course_id}`);
          }
        } catch (e) {
          errorCount++;
          console.error(`Error deleting course ${course.course_id}:`, e);
        }
      }
      
      return { 
        count: successCount, 
        errors: errorCount,
        message: `Successfully deleted ${successCount} courses with ${errorCount} errors`
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      if (result.count > 0) {
        toast.success(`Successfully deleted ${result.count} courses`);
      } else {
        toast.info(result.message);
      }
    },
    onError: (error: Error) => {
      console.error('Error batch deleting courses:', error);
      
      if (!hasPermission) {
        toast.error('Only system administrators can permanently delete courses');
      } else {
        toast.error(`Failed to delete courses: ${error.message}`);
      }
    }
  });
}
