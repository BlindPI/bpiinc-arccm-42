
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseCertificationValue {
  id: string;
  course_id: string;
  certification_type: string;
  certification_value: string;
  created_at: string;
  updated_at: string;
}

export function useCourseCertificationValues(courseId?: string) {
  const queryClient = useQueryClient();

  const { data: certificationValues = [], isLoading } = useQuery({
    queryKey: ['course-certification-values', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_certification_values')
        .select('*')
        .eq('course_id', courseId);

      if (error) {
        console.error('Error fetching course certification values:', error);
        throw error;
      }

      return data as CourseCertificationValue[];
    },
    enabled: !!courseId,
  });

  const updateCertificationValue = useMutation({
    mutationFn: async ({ courseId, type, value }: { courseId: string, type: string, value: string | null }) => {
      // Check if a record already exists
      const { data: existingData, error: fetchError } = await supabase
        .from('course_certification_values')
        .select('*')
        .eq('course_id', courseId)
        .eq('certification_type', type)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (value === null || value === 'none') {
        // If value is null or 'none' and record exists, delete it
        if (existingData) {
          const { error: deleteError } = await supabase
            .from('course_certification_values')
            .delete()
            .eq('id', existingData.id);

          if (deleteError) throw deleteError;
        }
        return null;
      }

      if (existingData) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('course_certification_values')
          .update({ certification_value: value })
          .eq('id', existingData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return data;
      } else {
        // Insert new record
        const { data, error: insertError } = await supabase
          .from('course_certification_values')
          .insert([{
            course_id: courseId,
            certification_type: type,
            certification_value: value
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-certification-values'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Certification value updated');
    },
    onError: (error) => {
      console.error('Error updating certification value:', error);
      toast.error('Failed to update certification value');
    }
  });

  // Transform the data into a Record<string, string> format for easier use
  const certificationValuesMap = certificationValues.reduce<Record<string, string>>((acc, item) => {
    acc[item.certification_type] = item.certification_value;
    return acc;
  }, {});

  return {
    certificationValues: certificationValuesMap,
    isLoading,
    updateCertificationValue
  };
}
