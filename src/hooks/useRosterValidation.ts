
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RosterValidationResult {
  rosterId: string;
  rosterName: string;
  storedCount: number;
  actualCount: number;
  discrepancy: number;
}

export interface RosterFixResult {
  fixedRosterId: string;
  oldCount: number;
  newCount: number;
}

export function useRosterValidation() {
  const queryClient = useQueryClient();

  // Get validation results for all rosters
  const { data: validationResults, isLoading: isValidating } = useQuery({
    queryKey: ['roster-validation'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('validate_roster_counts');
      if (error) throw error;
      return (data || []) as RosterValidationResult[];
    }
  });

  // Fix all incorrect counts
  const fixAllCountsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('fix_roster_certificate_counts');
      if (error) throw error;
      return (data || []) as RosterFixResult[];
    },
    onSuccess: (results) => {
      if (results.length > 0) {
        toast.success(`Fixed ${results.length} roster certificate counts`);
      } else {
        toast.info('All roster counts are already correct');
      }
      queryClient.invalidateQueries({ queryKey: ['roster-validation'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-rosters'] });
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (error) => {
      toast.error(`Failed to fix counts: ${error.message}`);
    }
  });

  // Fix a specific roster count
  const fixSpecificCountMutation = useMutation({
    mutationFn: async (rosterId: string) => {
      // Get actual count for this roster
      const { count, error } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      
      // Update the roster
      const { error: updateError } = await supabase
        .from('rosters')
        .update({ certificate_count: count || 0 })
        .eq('id', rosterId);
      
      if (updateError) throw updateError;
      
      return { rosterId, newCount: count || 0 };
    },
    onSuccess: (result) => {
      toast.success(`Fixed count for roster: ${result.newCount} certificates`);
      queryClient.invalidateQueries({ queryKey: ['roster-validation'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-rosters'] });
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (error) => {
      toast.error(`Failed to fix count: ${error.message}`);
    }
  });

  return {
    validationResults,
    isValidating,
    fixAllCounts: fixAllCountsMutation.mutate,
    isFixingAll: fixAllCountsMutation.isPending,
    fixSpecificCount: fixSpecificCountMutation.mutate,
    isFixingSpecific: fixSpecificCountMutation.isPending,
    hasDiscrepancies: validationResults && validationResults.length > 0
  };
}
