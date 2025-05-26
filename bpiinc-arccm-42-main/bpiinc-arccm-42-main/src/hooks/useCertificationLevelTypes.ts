
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCertificationLevelTypes() {
  const queryClient = useQueryClient();
  
  const { data: certificationTypes = [], isLoading } = useQuery({
    queryKey: ['certification-types'],
    queryFn: async () => {
      // Get unique certification level types from the database
      const { data, error } = await supabase
        .from('certification_levels')
        .select('type')
        .order('type');
      
      if (error) {
        console.error('Error fetching certification types:', error);
        toast.error('Failed to load certification types');
        throw error;
      }
      
      // Extract unique types
      const types = [...new Set(data.map(item => item.type))];
      return types;
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const addCertificationType = useMutation({
    mutationFn: async (newType: string) => {
      // Check if the certification type already exists
      const { data: existingTypes, error: checkError } = await supabase
        .from('certification_levels')
        .select('type')
        .eq('type', newType)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking certification type:', checkError);
        throw checkError;
      }
      
      if (existingTypes && existingTypes.length > 0) {
        return { success: false, message: 'Type already exists' };
      }
      
      // In order to create a type, we need to create at least one certification level
      // with that type. We'll create a placeholder level called "[Type] Level 1"
      const placeholderName = `${newType} Level 1`;
      
      const { data, error } = await supabase
        .from('certification_levels')
        .insert([{
          name: placeholderName,
          type: newType,
          active: true
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating certification type:', error);
        throw error;
      }
      
      return { success: true, type: newType, level: data };
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['certification-types'] });
        queryClient.invalidateQueries({ queryKey: ['certification-levels'] });
        toast.success(`Certification type "${result.type}" added successfully`);
      } else {
        toast.info(result.message);
      }
    },
    onError: (error) => {
      console.error('Failed to add certification type:', error);
      toast.error('Failed to add certification type');
    }
  });

  return {
    certificationTypes,
    isLoading,
    addCertificationType
  };
}
