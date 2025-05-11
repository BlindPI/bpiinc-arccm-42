
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
        // Get status counts
        const statusCountsPromise = supabase.rpc('get_certificate_status_counts');
        
        // Get monthly trends
        const monthlyTrendsPromise = supabase.rpc('get_monthly_certificate_counts', {
          months_limit: monthsForTrends
        });
        
        // Get top courses
        const topCoursesPromise = supabase.rpc('get_top_certificate_courses', {
          limit_count: topCoursesLimit
        });
        
        // Run all queries in parallel
        const [statusCountsResult, monthlyTrendsResult, topCoursesResult] = await Promise.all([
          statusCountsPromise,
          monthlyTrendsPromise,
          topCoursesPromise
        ]);
        
        if (statusCountsResult.error) throw statusCountsResult.error;
        if (monthlyTrendsResult.error) throw monthlyTrendsResult.error;
        if (topCoursesResult.error) throw topCoursesResult.error;
        
        // Calculate totals from status counts
        let totalActive = 0;
        let totalExpired = 0;
        let totalRevoked = 0;
        
        statusCountsResult.data.forEach((item: StatusCount) => {
          if (item.status === 'ACTIVE') totalActive = Number(item.count);
          if (item.status === 'EXPIRED') totalExpired = Number(item.count);
          if (item.status === 'REVOKED') totalRevoked = Number(item.count);
        });
        
        return {
          status_counts: statusCountsResult.data || [],
          monthly_trends: monthlyTrendsResult.data || [],
          top_courses: topCoursesResult.data || [],
          total_active: totalActive,
          total_expired: totalExpired,
          total_revoked: totalRevoked,
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
