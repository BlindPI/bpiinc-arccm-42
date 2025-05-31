
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRosterCertificateCount(rosterId: string) {
  const queryClient = useQueryClient();

  // Get actual certificate count from database
  const { data: actualCount, isLoading } = useQuery({
    queryKey: ['roster-certificate-count', rosterId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fix certificate count in roster table
  const fixCountMutation = useMutation({
    mutationFn: async (correctCount: number) => {
      const { error } = await supabase
        .from('rosters')
        .update({ certificate_count: correctCount })
        .eq('id', rosterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Certificate count corrected');
      queryClient.invalidateQueries({ queryKey: ['enhanced-rosters'] });
    },
    onError: (error) => {
      toast.error(`Failed to fix count: ${error.message}`);
    }
  });

  return {
    actualCount,
    isLoading,
    fixCount: fixCountMutation.mutate,
    isFixing: fixCountMutation.isPending
  };
}
