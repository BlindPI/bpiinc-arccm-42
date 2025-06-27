
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubmissionToReview {
  id: string;
  user_id: string;
  user_name: string;
  metric_name: string;
  submitted_at: string;
  current_value: string;
  compliance_status: string;
}

export function useSubmissionsToReview() {
  return useQuery({
    queryKey: ['submissions-to-review'],
    queryFn: async (): Promise<SubmissionToReview[]> => {
      const { data, error } = await supabase
        .rpc('get_pending_compliance_submissions');

      if (error) {
        console.error('Error fetching submissions to review:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });
}
