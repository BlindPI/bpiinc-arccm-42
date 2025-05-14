
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
        // Get status counts - avoiding deep chain
        const statusCountsResult = await supabase.rpc('get_certificate_status_counts');
        if (statusCountsResult.error) throw statusCountsResult.error;
        
        // Get monthly trends - avoiding deep chain
        const monthlyTrendsResult = await supabase.rpc('get_monthly_certificate_counts', {
          months_limit: monthsForTrends
        });
        if (monthlyTrendsResult.error) throw monthlyTrendsResult.error;
        
        // Get top courses - avoiding deep chain
        const topCoursesResult = await supabase.rpc('get_top_certificate_courses', {
          limit_count: topCoursesLimit
        });
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

        // Transform monthly data to include separated year and month
        const monthlyTrends = monthlyTrendsResult.data.map((item: any) => {
          // The format from DB is expected to be YYYY-MM
          const [yearStr, monthStr] = item.month.split('-');
          return {
            month: monthStr,
            year: parseInt(yearStr, 10),
            count: Number(item.count)
          };
        });
        
        return {
          status_counts: statusCountsResult.data || [],
          monthly_trends: monthlyTrends || [],
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
