
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
    }
  });

  const addCertificationType = useMutation({
    mutationFn: async (newType: string) => {
      // This doesn't directly add a type to the database since types exist as properties
      // of certification levels. We're just checking if it already exists.
      const { data, error } = await supabase
        .from('certification_levels')
        .select('type')
        .eq('type', newType)
        .limit(1);
      
      if (error) {
        console.error('Error checking certification type:', error);
        toast.error('Failed to check certification type');
        throw error;
      }
      
      if (data.length > 0) {
        toast.info('This certification type already exists');
        return null;
      }
      
      return newType;
    },
    onSuccess: (type) => {
      if (type) {
        queryClient.invalidateQueries({ queryKey: ['certification-types'] });
        toast.success(`Certification type "${type}" is ready to use`);
      }
    }
  });

  return {
    certificationTypes,
    isLoading,
    addCertificationType
  };
}
