
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

interface LocationCount {
  location_name: string;
  count: number;
}

interface InstructorCount {
  instructor_name: string;
  count: number;
}

interface VerificationMetrics {
  total_verifications: number;
  successful_verifications: number;
  failed_verifications: number;
}

export interface AnalyticsData {
  statusCounts: StatusCount[];
  monthlyTrends: MonthlyTrend[];
  topCourses: CourseCount[];
  topLocations: LocationCount[];
  topInstructors: InstructorCount[];
  verificationMetrics: VerificationMetrics;
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
  locationId?: string;
  courseId?: string;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export function useCertificateAnalytics({
  monthsForTrends = 6,
  topCoursesLimit = 5,
  daysForTopCourses = 365,
  locationId,
  courseId,
  startDate,
  endDate,
  enabled = true
}: AnalyticsOptions = {}): AnalyticsData {
  const [error, setError] = useState<Error | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['certificateAnalytics', monthsForTrends, topCoursesLimit, daysForTopCourses, locationId, courseId, startDate, endDate],
    queryFn: async () => {
      try {
        // Get status counts - breaking down the query chains
        let statusCountsQuery = supabase.rpc('get_certificate_status_counts');
        
        // Apply filters if provided
        if (locationId) {
          statusCountsQuery = statusCountsQuery.eq('location_id', locationId);
        }
        if (courseId) {
          statusCountsQuery = statusCountsQuery.eq('course_id', courseId);
        }
        const statusCountsPromise = statusCountsQuery;
        
        // Get monthly trends
        let monthlyTrendsQuery = supabase.rpc('get_monthly_certificate_counts', {
          months_limit: monthsForTrends
        });
        
        // Apply filters if provided
        if (locationId) {
          monthlyTrendsQuery = monthlyTrendsQuery.eq('location_id', locationId);
        }
        if (courseId) {
          monthlyTrendsQuery = monthlyTrendsQuery.eq('course_id', courseId);
        }
        const monthlyTrendsPromise = monthlyTrendsQuery;
        
        // Get top courses
        const topCoursesPromise = supabase.rpc('get_top_certificate_courses', {
          limit_count: topCoursesLimit
        });
        
        // Enhanced queries for the new analytics features
        // Get top locations (using a direct table query for now)
        const topLocationsPromise = supabase
          .from('certificates')
          .select('location_id, locations(name)')
          .not('location_id', 'is', null)
          .limit(topCoursesLimit);
        
        // Get instructor metrics
        const topInstructorsPromise = supabase
          .from('certificates')
          .select('issued_by, profiles(display_name)')
          .not('issued_by', 'is', null)
          .limit(topCoursesLimit);
        
        // Get verification metrics (last 30 days by default)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const verificationMetricsPromise = supabase
          .from('certificate_verification_logs')
          .select('result')
          .gte('verification_time', thirtyDaysAgo.toISOString());
        
        // Run all queries in parallel
        const [
          statusCountsResult, 
          monthlyTrendsResult, 
          topCoursesResult,
          topLocationsResult,
          topInstructorsResult,
          verificationMetricsResult
        ] = await Promise.all([
          statusCountsPromise,
          monthlyTrendsPromise,
          topCoursesPromise,
          topLocationsPromise,
          topInstructorsPromise,
          verificationMetricsPromise
        ]);
        
        if (statusCountsResult.error) throw statusCountsResult.error;
        if (monthlyTrendsResult.error) throw monthlyTrendsResult.error;
        if (topCoursesResult.error) throw topCoursesResult.error;
        if (topLocationsResult.error) throw topLocationsResult.error;
        if (topInstructorsResult.error) throw topInstructorsResult.error;
        if (verificationMetricsResult.error) throw verificationMetricsResult.error;
        
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
        
        // Process location data
        const locationCounts: LocationCount[] = [];
        const locationMap = new Map<string, number>();
        
        topLocationsResult.data.forEach((cert: any) => {
          const locationName = cert.locations?.name || 'Unknown';
          const currentCount = locationMap.get(locationName) || 0;
          locationMap.set(locationName, currentCount + 1);
        });
        
        locationMap.forEach((count, name) => {
          locationCounts.push({ location_name: name, count });
        });
        
        // Process instructor data
        const instructorCounts: InstructorCount[] = [];
        const instructorMap = new Map<string, number>();
        
        topInstructorsResult.data.forEach((cert: any) => {
          const instructorName = cert.profiles?.display_name || 'Unknown';
          const currentCount = instructorMap.get(instructorName) || 0;
          instructorMap.set(instructorName, currentCount + 1);
        });
        
        instructorMap.forEach((count, name) => {
          instructorCounts.push({ instructor_name: name, count });
        });
        
        // Process verification metrics
        const totalVerifications = verificationMetricsResult.data.length;
        const successfulVerifications = verificationMetricsResult.data.filter(
          (log: any) => log.result === 'FOUND'
        ).length;
        const failedVerifications = totalVerifications - successfulVerifications;
        
        return {
          status_counts: statusCountsResult.data || [],
          monthly_trends: monthlyTrends || [],
          top_courses: topCoursesResult.data || [],
          top_locations: locationCounts,
          top_instructors: instructorCounts,
          verification_metrics: {
            total_verifications: totalVerifications,
            successful_verifications: successfulVerifications,
            failed_verifications: failedVerifications
          },
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
    topLocations: data?.top_locations || [],
    topInstructors: data?.top_instructors || [],
    verificationMetrics: data?.verification_metrics || {
      total_verifications: 0,
      successful_verifications: 0,
      failed_verifications: 0
    },
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
