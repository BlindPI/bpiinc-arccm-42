
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealTimeTrends(period: 'hour' | 'day' = 'day') {
  return useQuery({
    queryKey: ['realtime-trends', period],
    queryFn: async () => {
      // Get certificate trends
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('created_at, status')
        .eq('status', 'ACTIVE')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (certError) throw certError;

      // Get course trends
      const { data: courses, error: courseError } = await supabase
        .from('course_offerings')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (courseError) throw courseError;

      // Get team activity trends
      const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('created_at, status')
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (teamError) throw teamError;

      // Process data into trends
      const certificateTrend = certificates?.length || 0;
      const courseTrend = courses?.length || 0;
      const teamTrend = teams?.length || 0;

      return {
        certificates: certificateTrend,
        courses: courseTrend,
        teams: teamTrend,
        period
      };
    },
    refetchInterval: period === 'hour' ? 60000 : 300000, // 1 min for hour, 5 min for day
  });
}
