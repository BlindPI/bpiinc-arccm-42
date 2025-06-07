
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressionAutomationService } from '@/services/progression/progressionAutomationService';
import { toast } from 'sonner';

export function useProgressionAutomation(userId: string) {
  const queryClient = useQueryClient();

  const { data: progressionReport, isLoading: loadingReport } = useQuery({
    queryKey: ['progression-report', userId],
    queryFn: () => ProgressionAutomationService.generateProgressionReport(userId),
    enabled: !!userId
  });

  const triggerProgression = useMutation({
    mutationFn: ({ targetRole }: { targetRole: string }) =>
      ProgressionAutomationService.triggerAutomatedProgression(userId, targetRole),
    onSuccess: () => {
      toast.success('Progression initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['progression-report', userId] });
    },
    onError: (error) => {
      toast.error('Failed to initiate progression: ' + error.message);
    }
  });

  return {
    progressionReport,
    loadingReport,
    triggerProgression
  };
}
