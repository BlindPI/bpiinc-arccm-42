
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Award, Calendar, ChartBar, Info } from 'lucide-react';
import { AnalyticsData } from './charts/types';
import { StatusDistributionCard } from './charts/StatusDistributionChart';
import { TopCoursesCard } from './charts/TopCoursesChart';
import { TimelineCard } from './charts/TimelineChart';
import { CourseDistributionCard } from './charts/CourseDistributionChart';

const CertificateAnalytics = () => {
  const { generateBulkStats, isAdmin } = useCertificateOperations();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching certificate analytics data...");
        const stats = await generateBulkStats();
        console.log("Received stats:", stats);
        
        if (!stats) {
          throw new Error("No data returned from analytics query");
        }
        
        // Validate data structure
        if (!Array.isArray(stats.statusCounts) || !Array.isArray(stats.monthlyData) || !Array.isArray(stats.topCourses)) {
          console.warn("Invalid data structure received:", stats);
          throw new Error("Invalid analytics data structure");
        }
        
        // Make sure all data is properly formatted
        const validatedData: AnalyticsData = {
          statusCounts: (stats.statusCounts || []).map(item => ({
            status: item.status || 'Unknown',
            count: parseInt(item.count) || 0
          })),
          monthlyData: (stats.monthlyData || []).map(item => ({
            month: item.month || 'Unknown',
            count: parseInt(item.count) || 0
          })),
          topCourses: (stats.topCourses || []).map(item => ({
            course_name: item.course_name || 'Unknown Course',
            count: parseInt(item.count) || 0
          }))
        };
        
        setAnalyticsData(validatedData);
      } catch (err: any) {
        console.error("Failed to load analytics data:", err);
        setError(err.message || "An error occurred while loading analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [generateBulkStats]);

  // Format data for charts
  const prepareChartData = () => {
    if (!analyticsData) return {
      statusData: [],
      monthlyData: [],
      courseData: []
    };

    // Format status data for chart display
    const statusData = analyticsData.statusCounts.map((item) => ({
      name: item.status || 'Unknown',
      value: item.count || 0
    }));

    // Format monthly data for timeline chart
    const monthlyData = analyticsData.monthlyData.map((item) => ({
      month: item.month || 'Unknown',
      count: item.count || 0
    }));

    // Format course data for bar chart
    const courseData = analyticsData.topCourses.map((item) => ({
      name: item.course_name 
        ? (item.course_name.length > 20 
            ? item.course_name.substring(0, 20) + '...' 
            : item.course_name)
        : 'Unknown',
      value: item.count || 0,
      fullName: item.course_name || 'Unknown'
    }));

    return { statusData, monthlyData, courseData };
  };

  // Early return for loading state
  if (isLoading) {
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
          {error}. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Early return for no data state
  if (!analyticsData) {
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

  const { statusData, monthlyData, courseData } = prepareChartData();

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50/80">
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              By Course
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatusDistributionCard data={statusData} />
              <TopCoursesCard data={courseData} />
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <TimelineCard data={monthlyData} />
          </TabsContent>
          
          <TabsContent value="courses" className="mt-4">
            <CourseDistributionCard data={courseData} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground italic">
        Data is updated in real-time based on certificate issuance and status changes
      </CardFooter>
    </Card>
  );
};

export default CertificateAnalytics;
