
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UseCourseFormProps {
  onSuccess?: () => void;
}

export function useCourseForm({ onSuccess }: UseCourseFormProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    expirationMonths: '24',
    courseLength: '',
    courseTypeId: 'none',
    assessmentTypeId: 'none',
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
      assessment_type_id?: string | null;
      length?: number | null;
      first_aid_level?: string | null;
      cpr_level?: string | null;
    }) => {
      console.log('Creating course with data:', data);
      const { error } = await supabase.from('courses').insert([data]);
      if (error) throw error;
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
        assessmentTypeId: 'none',
        firstAidLevel: 'none',
        cprLevel: 'none',
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast.error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      assessment_type_id: formState.assessmentTypeId !== 'none' ? formState.assessmentTypeId : null,
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
