
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
    code: '',
    description: '',
    expirationMonths: '24',
    courseLength: '',
    courseTypeId: 'none',
    firstAidLevel: 'none',
    cprLevel: 'none',
    reason: '', // Field for audit logging
    certificationValues: {} as Record<string, string>, // For additional certification values
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
      code?: string;
      description: string;
      expiration_months: number;
      created_by: string;
      course_type_id?: string | null;
      length?: number | null;
      first_aid_level?: string | null;
      cpr_level?: string | null;
      reason?: string | null;
      certificationValues?: Record<string, string>; // New field for certification values
    }) => {
      // Pull out reason and certificationValues before sending to supabase
      const { reason, certificationValues, ...courseData } = data;
      
      console.log('Creating course with data:', courseData);
      
      // If user doesn't have permission, throw early
      if (!hasPermission) {
        throw new Error('You do not have permission to create courses');
      }
      
      // Create the course
      const { error, data: newCourseData } = await supabase
        .from('courses')
        .insert([courseData])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // If the course was created successfully
      if (newCourseData && newCourseData[0]) {
        const courseId = newCourseData[0].id;
        
        // Insert certification values if provided
        if (certificationValues && Object.keys(certificationValues).length > 0) {
          // Add standard FA and CPR to certification values if provided
          const allCertValues = { ...certificationValues };
          
          if (data.first_aid_level) {
            allCertValues['FIRST_AID'] = data.first_aid_level;
          }
          
          if (data.cpr_level) {
            allCertValues['CPR'] = data.cpr_level;
          }
          
          // Prepare all certification values for insert
          const certValuesForInsert = Object.entries(allCertValues).map(([type, value]) => ({
            course_id: courseId,
            certification_type: type,
            certification_value: value
          }));
          
          if (certValuesForInsert.length > 0) {
            const { error: certError } = await supabase
              .from('course_certification_values')
              .insert(certValuesForInsert);
            
            if (certError) {
              console.error('Error inserting certification values:', certError);
              // Don't fail the whole operation if just inserting cert values fails
            }
          }
        }
        
        // Log the reason separately if provided
        if (reason) {
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
      }
      
      return newCourseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      
      // Reset form
      setFormState({
        name: '',
        code: '',
        description: '',
        expirationMonths: '24',
        courseLength: '',
        courseTypeId: 'none',
        firstAidLevel: 'none',
        cprLevel: 'none',
        reason: '',
        certificationValues: {},
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
      code: formState.code || undefined,
      description: formState.description,
      expiration_months: parseInt(formState.expirationMonths),
      created_by: user.id,
      course_type_id: formState.courseTypeId !== 'none' ? formState.courseTypeId : null,
      length: formState.courseLength ? parseInt(formState.courseLength) : null,
      first_aid_level: formState.firstAidLevel !== 'none' ? formState.firstAidLevel : null,
      cpr_level: formState.cprLevel !== 'none' ? formState.cprLevel : null,
      reason: formState.reason || null,
      certificationValues: formState.certificationValues,
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
