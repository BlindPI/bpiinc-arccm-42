
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';
import { useProfile } from '@/hooks/useProfile';

interface UseCourseFormProps {
  onSuccess?: () => void;
}

export function useCourseForm({ onSuccess }: UseCourseFormProps = {}) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Form state with focused fields
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    expirationMonths: '24',
    courseLength: '',
    courseTypeId: 'none',
    firstAidLevel: 'none',
    cprLevel: 'none',
    reason: '', // New field for audit logging
  });

  // Helper function to update form state
  const updateField = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Check if user has permission to create courses
  const hasPermission = profile?.role && ['SA', 'AD'].includes(profile.role);

  const createCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by: string;
      course_type_id?: string | null;
      length?: number | null;
      first_aid_level?: string | null;
      cpr_level?: string | null;
      reason?: string | null;
    }) => {
      // Pull out reason before sending to supabase
      const { reason, ...courseData } = data;
      
      console.log('Creating course with data:', courseData);
      
      // If user doesn't have permission, throw early
      if (!hasPermission) {
        throw new Error('You do not have permission to create courses');
      }
      
      // Create the course
      const { error, data: courseData } = await supabase
        .from('courses')
        .insert([courseData])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (courseData && courseData[0] && reason) {
        // Log the reason separately if provided
        const courseId = courseData[0].id;
        try {
          const { error: logError } = await supabase.rpc('log_course_action', {
            course_id: courseId,
            action_type: 'CREATE_WITH_REASON',
            changes: null,
            reason_text: reason
          });
          
          if (logError) {
            console.error('Error logging course reason:', logError);
          }
        } catch (e) {
          console.error('Failed to log course reason:', e);
          // Don't fail the entire operation if just the reason logging fails
        }
      }
      
      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      
      // Reset form
      setFormState({
        name: '',
        description: '',
        expirationMonths: '24',
        courseLength: '',
        courseTypeId: 'none',
        firstAidLevel: 'none',
        cprLevel: 'none',
        reason: '',
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Error creating course:', error);
      
      const postgrestError = error as PostgrestError;
      
      if (postgrestError?.code === '23505') {
        toast.error('A course with this name already exists');
      } else if (postgrestError?.code === '42501') {
        toast.error('You do not have permission to create courses');
      } else if (!hasPermission) {
        toast.error('You do not have permission to create courses');
      } else {
        toast.error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create courses');
      return;
    }
    
    if (!hasPermission) {
      toast.error('You do not have permission to create courses');
      return;
    }

    createCourse.mutate({
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      course_type_id: formState.courseTypeId !== 'none' ? formState.courseTypeId : null,
      length: formState.courseLength ? parseInt(formState.courseLength) : null,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : null,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : null,
      reason: formState.reason || null,
    });
  };

  return {
    formState,
    updateField,
    handleSubmit,
    isSubmitting: createCourse.isPending,
    hasPermission
  };
}
