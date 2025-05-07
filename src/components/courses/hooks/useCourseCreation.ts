
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCourseCreation() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expirationMonths, setExpirationMonths] = useState('12');
  const [courseLength, setCourseLength] = useState('');
  const [courseTypeId, setCourseTypeId] = useState('');
  const [assessmentTypeId, setAssessmentTypeId] = useState('');
  const [firstAidLevel, setFirstAidLevel] = useState('none');
  const [cprLevel, setCprLevel] = useState('none');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      expiration_months: number;
      created_by: string;
      course_type_id?: string;
      assessment_type_id?: string;
      length?: number;
      first_aid_level?: string;
      cpr_level?: string;
    }) => {
      const { error } = await supabase.from('courses').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      // Reset form
      setName('');
      setDescription('');
      setExpirationMonths('12');
      setCourseLength('');
      setCourseTypeId('');
      setAssessmentTypeId('');
      setFirstAidLevel('none');
      setCprLevel('none');
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    },
  });

  return {
    formState: {
      name,
      description,
      expirationMonths,
      courseLength,
      courseTypeId,
      assessmentTypeId,
      firstAidLevel,
      cprLevel,
    },
    setters: {
      setName,
      setDescription,
      setExpirationMonths,
      setCourseLength,
      setCourseTypeId,
      setAssessmentTypeId,
      setFirstAidLevel,
      setCprLevel,
    },
    createCourse,
    user
  };
}
