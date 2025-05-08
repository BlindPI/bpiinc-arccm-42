
import { useState, useEffect } from 'react';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';

// Types for our analytics data
export interface AnalyticsItem {
  name: string;
  value: number;
  fullName?: string;
}

export interface TimelineItem {
  month: string;
  count: number;
}

export interface AnalyticsSummary {
  totalCertificates: number;
  activeCertificates: number;
  expiringCertificates: number;
  coursesWithCertificates: number;
}

export interface CertificateAnalyticsResult {
  isLoading: boolean;
  error: string | null;
  statusData: AnalyticsItem[];
  timelineData: TimelineItem[];
  courseData: AnalyticsItem[];
  summary: AnalyticsSummary;
}

export function useCertificateAnalytics(): CertificateAnalyticsResult {
  const { generateBulkStats, isAdmin } = useCertificateOperations();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<AnalyticsItem[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [courseData, setCourseData] = useState<AnalyticsItem[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalCertificates: 0,
    activeCertificates: 0,
    expiringCertificates: 0,
    coursesWithCertificates: 0
  });

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);
      
      try {
        const stats = await generateBulkStats();
        
        if (!stats) {
          throw new Error("No data returned from analytics query");
        }
        
        // Process status distribution data
        const validStatusData = (stats.statusCounts || []).map(item => ({
          name: item.status || 'Unknown',
          value: parseInt(String(item.count)) || 0
        }));
        setStatusData(validStatusData);
        
        // Process timeline data
        const validTimelineData = (stats.monthlyData || []).map(item => ({
          month: item.month || 'Unknown',
          count: parseInt(String(item.count)) || 0
        }));
        setTimelineData(validTimelineData);
        
        // Process course distribution data
        const validCourseData = (stats.topCourses || []).map(item => {
          const courseName = item.course_name || 'Unknown Course';
          return {
            name: courseName.length > 20 ? courseName.substring(0, 20) + '...' : courseName,
            value: parseInt(String(item.count)) || 0,
            fullName: courseName
          };
        });
        setCourseData(validCourseData);
        
        // Calculate summary metrics
        const totalCerts = validStatusData.reduce((sum, item) => sum + item.value, 0);
        const activeCerts = validStatusData.find(item => item.name === 'ACTIVE')?.value || 0;
        
        // Calculate certificates expiring in the next 30 days (from monthlyData)
        const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
        const expiringCerts = validTimelineData.find(item => item.month === currentMonth)?.count || 0;
        
        setSummary({
          totalCertificates: totalCerts,
          activeCertificates: activeCerts,
          expiringCertificates: expiringCerts,
          coursesWithCertificates: validCourseData.length
        });
        
      } catch (err: any) {
        console.error("Error loading certificate analytics:", err);
        setError(err.message || "Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [generateBulkStats]);

  return {
    isLoading,
    error,
    statusData,
    timelineData,
    courseData,
    summary
  };
}
