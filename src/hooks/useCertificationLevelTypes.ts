
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
      // This doesn't directly add a type to the database since types exist as properties
      // of certification levels. We're just checking if it already exists.
      const { data: existingTypes, error: checkError } = await supabase
        .from('certification_levels')
        .select('type')
        .eq('type', newType)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking certification type:', checkError);
        toast.error('Failed to check certification type');
        throw checkError;
      }
      
      if (existingTypes && existingTypes.length > 0) {
        toast.info('This certification type already exists');
        return null;
      }
      
      // In order to create a type, we need to create at least one certification level
      // with that type, but this is handled elsewhere, so we just return the new type
      return newType;
    },
    onSuccess: (type) => {
      if (type) {
        queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      }
    }
  });

  return {
    certificationTypes,
    isLoading,
    addCertificationType
  };
}
