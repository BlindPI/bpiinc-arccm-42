
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Award, ChartBar, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import useCertificateRequests from '../../hooks/useCertificateRequests';
import { safeToString } from './charts/ChartUtils';
import { StatusDistributionCard } from './charts/StatusDistributionChart';
import { TopCoursesCard } from './charts/TopCoursesChart';
import { TimelineCard } from './charts/TimelineChart';
import { AnalyticsData } from './charts/types';

const CertificateAnalytics = () => {
  const { data, loading, error } = useCertificateRequests();
  
  // Format data for charts
  const prepareChartData = (analyticsData: AnalyticsData | null) => {
    if (!analyticsData) return {
      statusData: [],
      monthlyData: [],
      courseData: []
    };

    // Format status data for chart display
    const statusData = (analyticsData.statusCounts || []).map((item) => ({
      name: safeToString(item.status || 'Unknown'),
      value: Number(item.count) || 0
    }));

    // Format monthly data for timeline chart
    const monthlyData = (analyticsData.monthlyData || []).map((item) => ({
      month: safeToString(item.month || 'Unknown'),
      count: Number(item.count) || 0
    }));

    // Format course data for bar chart
    const courseData = (analyticsData.topCourses || []).map((item) => ({
      name: safeToString(item.course_name 
        ? (item.course_name.length > 20 
            ? item.course_name.substring(0, 20) + '...' 
            : item.course_name)
        : 'Unknown'),
      value: Number(item.count) || 0,
      fullName: safeToString(item.course_name || 'Unknown')
    }));

    return { statusData, monthlyData, courseData };
  };

  // Early return for loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>
          {error.message || "An error occurred while loading analytics"}. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Early return for no data state
  if (!data) {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>No Analytics Data</AlertTitle>
        <AlertDescription>
          No certificate analytics data is currently available. This could be because there are no certificates in the system yet.
        </AlertDescription>
      </Alert>
    );
  }

  const { statusData, monthlyData, courseData } = prepareChartData(data);

  return (
    <Card className="border shadow-md bg-gradient-to-br from-white to-gray-50/80">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ChartBar className="h-5 w-5 text-primary" />
          Certificate Analytics Dashboard
        </CardTitle>
        <CardDescription>
          Visualize certificate data to track trends and performance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Two-column layout for status and top courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatusDistributionCard data={statusData} />
          <TopCoursesCard data={courseData} />
        </div>
        
        {/* Full-width timeline */}
        <div className="mt-6">
          <TimelineCard data={monthlyData} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateAnalytics;
