
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from 'lucide-react';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { StatusDistributionChart } from './StatusDistributionChart';
import { TimelineChart } from './TimelineChart';
import { CourseDistributionChart } from './CourseDistributionChart';

export const AnalyticsDashboard: React.FC = () => {
  const { 
    isLoading, 
    error, 
    statusData, 
    timelineData, 
    courseData, 
    summary 
  } = useCertificateAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[300px] mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>
          {error}. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if we have any data to display
  const hasData = statusData.length > 0 || timelineData.length > 0 || courseData.length > 0;

  if (!hasData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Analytics Data</AlertTitle>
        <AlertDescription>
          No certificate analytics data is currently available. This could be because there are no certificates in the system yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics Cards */}
      <AnalyticsSummaryCards data={summary} />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionChart data={statusData} />
        <CourseDistributionChart data={courseData} />
      </div>
      
      {/* Timeline Chart (Full Width) */}
      <TimelineChart data={timelineData} />
    </div>
  );
};
