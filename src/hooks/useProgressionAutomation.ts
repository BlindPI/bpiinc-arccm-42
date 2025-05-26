
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressionAutomationService } from '@/services/progression/progressionAutomationService';
import { toast } from 'sonner';
import type { UserRole } from '@/types/supabase-schema';

export function useProgressionAutomation(userId?: string) {
  const queryClient = useQueryClient();

  // Get detailed progression report
  const { 
    data: progressionReport, 
    isLoading: loadingReport, 
    error: reportError 
  } = useQuery({
    queryKey: ['progression-report', userId],
    queryFn: () => ProgressionAutomationService.generateProgressionReport(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Evaluate eligibility for specific role
  const evaluateEligibility = useMutation({
    mutationFn: ({ targetRole }: { targetRole: UserRole }) =>
      ProgressionAutomationService.evaluateProgressionEligibility(userId!, targetRole),
    onError: (error: any) => {
      toast.error(`Failed to evaluate eligibility: ${error.message}`);
    }
  });

  // Trigger automated progression
  const triggerProgression = useMutation({
    mutationFn: ({ targetRole }: { targetRole: UserRole }) =>
      ProgressionAutomationService.triggerAutomatedProgression(userId!, targetRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-report', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
    },
    onError: (error: any) => {
      toast.error(`Progression failed: ${error.message}`);
    }
  });

  return {
    progressionReport,
    loadingReport,
    reportError,
    evaluateEligibility,
    triggerProgression,
  };
}
