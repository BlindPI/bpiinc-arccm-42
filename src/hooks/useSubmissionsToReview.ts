
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
      // Use the existing database function
      const { data, error } = await supabase
        .rpc('get_pending_compliance_submissions');

      if (error) {
        console.error('Error fetching submissions to review:', error);
        // If no data exists yet, return empty array instead of throwing
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          console.log('No pending submissions found - returning empty array');
          return [];
        }
        throw error;
      }

      return data || [];
    },
    refetchInterval: 60000,
    staleTime: 30000
  });
}
