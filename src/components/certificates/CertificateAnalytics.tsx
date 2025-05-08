
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';
import { SummaryMetricsCards } from './analytics/SummaryMetricsCards';
import { StatusDistributionChart } from './analytics/StatusDistributionChart';
import { TimelineChart } from './analytics/TimelineChart';
import { CourseDistributionChart } from './analytics/CourseDistributionChart';

const CertificateAnalytics: React.FC = () => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
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
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>No Analytics Data</AlertTitle>
        <AlertDescription>
          No certificate analytics data is currently available. This could be because there are no certificates in the system yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50/80">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ChartBar className="h-5 w-5 text-primary" />
          Certificate Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Summary Metrics */}
        <SummaryMetricsCards data={summary} />

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusDistributionChart data={statusData} />
          <CourseDistributionChart data={courseData} />
        </div>
        
        {/* Timeline Chart (Full Width) */}
        <TimelineChart data={timelineData} />
      </CardContent>
    </Card>
  );
};

export default CertificateAnalytics;
