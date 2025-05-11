
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for analytics data
interface StatusCount {
  status: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  year: number;
  count: number;
}

interface CourseCount {
  course_name: string;
  count: number;
}

export interface AnalyticsData {
  statusCounts: StatusCount[];
  monthlyTrends: MonthlyTrend[];
  topCourses: CourseCount[];
  totalActive: number;
  totalExpired: number;
  totalRevoked: number;
  generatedAt: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface AnalyticsOptions {
  monthsForTrends?: number;
  topCoursesLimit?: number;
  daysForTopCourses?: number;
  enabled?: boolean;
}

export function useCertificateAnalytics({
  monthsForTrends = 6,
  topCoursesLimit = 5,
  daysForTopCourses = 365,
  enabled = true
}: AnalyticsOptions = {}): AnalyticsData {
  const [error, setError] = useState<Error | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['certificateAnalytics', monthsForTrends, topCoursesLimit, daysForTopCourses],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('certificate_analytics_dashboard', {
          months_for_trends: monthsForTrends,
          top_courses_limit: topCoursesLimit,
          days_for_top_courses: daysForTopCourses,
        });

        if (error) throw error;
        
        return data || {
          status_counts: [],
          monthly_trends: [],
          top_courses: [],
          total_active: 0,
          total_expired: 0,
          total_revoked: 0,
          generated_at: new Date().toISOString()
        };
      } catch (err) {
        console.error('Error fetching certificate analytics:', err);
        const error = err instanceof Error ? err : new Error('Failed to fetch analytics data');
        setError(error);
        toast.error(`Analytics error: ${error.message}`);
        throw error;
      }
    },
    enabled: enabled,
  });

  return {
    statusCounts: data?.status_counts || [],
    monthlyTrends: data?.monthly_trends || [],
    topCourses: data?.top_courses || [],
    totalActive: data?.total_active || 0,
    totalExpired: data?.total_expired || 0,
    totalRevoked: data?.total_revoked || 0,
    generatedAt: data?.generated_at || new Date().toISOString(),
    isLoading,
    isError,
    error,
    refetch,
  };
}
