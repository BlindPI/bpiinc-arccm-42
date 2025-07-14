
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Course } from '@/types/courses';

interface UseCourseFormProps {
  onSuccess?: () => void;
  course?: Course;
}

export function useCourseForm({ onSuccess, course }: UseCourseFormProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!course;
  
  // Form state - populate with course data if editing
  const [formState, setFormState] = useState({
    name: course?.name || '',
    description: course?.description || '',
    expirationMonths: course?.expiration_months?.toString() || '24',
    courseLength: course?.length?.toString() || '',
    courseTypeId: course?.course_type_id || 'none',
    assessmentTypeId: course?.assessment_type_id || 'none',
    firstAidLevel: course?.first_aid_level || 'none',
    cprLevel: course?.cpr_level || 'none',
  });

  // Helper function to update form state
  const updateField = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const saveCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by?: string;
      course_type_id?: string | null;
      assessment_type_id?: string | null;
      length?: number | null;
      first_aid_level?: string | null;
      cpr_level?: string | null;
    }) => {
      if (isEditMode && course) {
        console.log('Updating course with data:', data);
        const { error } = await supabase
          .from('courses')
          .update(data)
          .eq('id', course.id);
        if (error) throw error;
      } else {
        console.log('Creating course with data:', data);
        const { error } = await supabase.from('courses').insert([{ ...data, created_by: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(isEditMode ? 'Course updated successfully' : 'Course created successfully');
      
      // Reset form only for create mode
      if (!isEditMode) {
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
      }
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} course:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create courses');
      return;
    }

    saveCourse.mutate({
      name: formState.name,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
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
    isSubmitting: saveCourse.isPending,
    isEditMode
  };
}
