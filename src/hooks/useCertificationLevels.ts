
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CertificationLevel, CertificationLevelInput } from '@/types/certification-levels';

export function useCertificationLevels(type?: string) {
  const queryClient = useQueryClient();
  
  const { data: certificationLevels = [], isLoading } = useQuery({
    queryKey: ['certification-levels', type],
    queryFn: async () => {
      let query = supabase
        .from('certification_levels')
        .select('*');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching certification levels:', error);
        toast.error('Failed to load certification levels');
        throw error;
      }
      
      return data as CertificationLevel[];
    }
  });

  const createCertificationLevel = useMutation({
    mutationFn: async (newLevel: CertificationLevelInput) => {
      const { data, error } = await supabase
        .from('certification_levels')
        .insert([newLevel])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating certification level:', error);
        if (error.code === '23505') {
          toast.error('A certification level with this name already exists');
        } else {
          toast.error('Failed to create certification level');
        }
        throw error;
      }
      
      return data as CertificationLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-levels'] });
      toast.success('Certification level created successfully');
    }
  });

  const updateCertificationLevel = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationLevel> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_levels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating certification level:', error);
        if (error.code === '23505') {
          toast.error('A certification level with this name already exists');
        } else {
          toast.error('Failed to update certification level');
        }
        throw error;
      }
      
      return data as CertificationLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-levels'] });
      toast.success('Certification level updated successfully');
    }
  });

  const toggleCertificationLevelStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { data, error } = await supabase
        .from('certification_levels')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error toggling certification level status:', error);
        toast.error('Failed to update certification level status');
        throw error;
      }
      
      return data as CertificationLevel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certification-levels'] });
      toast.success(`Certification level ${data.active ? 'activated' : 'deactivated'} successfully`);
    }
  });

  return {
    certificationLevels,
    isLoading,
    createCertificationLevel,
    updateCertificationLevel,
    toggleCertificationLevelStatus,
  };
}
