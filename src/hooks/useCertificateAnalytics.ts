
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for our analytics data
export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface CourseData {
  course_name: string;
  count: number;
}

export interface AnalyticsData {
  statusCounts: StatusCount[];
  monthlyData: MonthlyData[];
  topCourses: CourseData[];
}

export function useCertificateAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['certificate_analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      try {
        console.log('Fetching certificate analytics data...');
        
        // Fetch status distribution
        const { data: statusData, error: statusError } = await supabase
          .rpc('get_certificate_status_counts');
          
        if (statusError) throw statusError;
        
        // Fetch monthly data
        const { data: monthlyData, error: monthlyError } = await supabase
          .rpc('get_monthly_certificate_counts', { months_limit: 6 });
          
        if (monthlyError) throw monthlyError;
        
        // Fetch top courses
        const { data: coursesData, error: coursesError } = await supabase
          .rpc('get_top_certificate_courses', { limit_count: 5 });
          
        if (coursesError) throw coursesError;
        
        const result = {
          statusCounts: statusData || [],
          monthlyData: monthlyData || [],
          topCourses: coursesData || []
        };
        
        console.log('Analytics data fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching certificate analytics:', error);
        toast.error('Failed to load analytics data');
        
        // Return empty data on error to avoid breaking UI
        return {
          statusCounts: [],
          monthlyData: [],
          topCourses: []
        };
      }
    },
  });
  
  return {
    data,
    isLoading,
    error
  };
}
