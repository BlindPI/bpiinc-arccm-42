
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

interface UseCourseFormProps {
  onSuccess?: () => void;
}

export function useCourseForm({ onSuccess }: UseCourseFormProps = {}) {
  const { user } = useAuth();
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
  });

  // Helper function to update form state
  const updateField = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

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
    }) => {
      console.log('Creating course with data:', data);
      const { error, data: courseData } = await supabase.from('courses').insert([data]).select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Log the creation event
      if (courseData && courseData[0]) {
        const courseId = courseData[0].id;
        console.log(`Course created successfully with ID: ${courseId}`);
        // Here we could add additional logging if needed
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
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error | PostgrestError) => {
      console.error('Error creating course:', error);
      
      const postgrestError = error as PostgrestError;
      
      if (postgrestError?.code === '23505') {
        toast.error('A course with this name already exists');
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

    createCourse.mutate({
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      course_type_id: formState.courseTypeId !== 'none' ? formState.courseTypeId : null,
      length: formState.courseLength ? parseInt(formState.courseLength) : null,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : null,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : null,
    });
  };

  return {
    formState,
    updateField,
    handleSubmit,
    isSubmitting: createCourse.isPending
  };
}
