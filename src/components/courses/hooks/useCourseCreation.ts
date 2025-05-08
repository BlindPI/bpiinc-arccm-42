
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
  const [certificationValues, setCertificationValues] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleCertificationValueChange = (type: string, value: string) => {
    setCertificationValues(prev => ({ ...prev, [type]: value === 'none' ? null : value }));
  };

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
      certification_values?: Record<string, string>;
    }) => {
      // Insert the course data
      const { data: courseData, error } = await supabase
        .from('courses')
        .insert([{
          name: data.name,
          description: data.description,
          expiration_months: data.expiration_months,
          created_by: data.created_by,
          course_type_id: data.course_type_id,
          assessment_type_id: data.assessment_type_id,
          length: data.length,
          first_aid_level: data.first_aid_level,
          cpr_level: data.cpr_level,
        }])
        .select()
        .single();

      if (error) throw error;

      // If we have additional certification values, insert them into the course_certification_values table
      if (data.certification_values && Object.keys(data.certification_values).length > 0) {
        const certificationEntries = Object.entries(data.certification_values)
          .filter(([_, value]) => value !== null && value !== 'none')
          .map(([type, value]) => ({
            course_id: courseData.id,
            certification_type: type,
            certification_value: value
          }));

        if (certificationEntries.length > 0) {
          const { error: certError } = await supabase
            .from('course_certification_values')
            .insert(certificationEntries);

          if (certError) throw certError;
        }
      }

      return courseData;
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
      setCertificationValues({});
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
      certificationValues,
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
      handleCertificationValueChange,
    },
    createCourse,
    user
  };
}
