
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Award, Calendar, ChartBar, Info } from 'lucide-react';

// Define proper types for analytics data
interface StatusCount {
  status: string;
  count: number;
}

interface MonthlyData {
  month: string; 
  count: number;
}

interface CourseData {
  name: string;
  value: number;
  fullName: string;
}

interface AnalyticsData {
  statusCounts: StatusCount[];
  monthlyData: MonthlyData[];
  topCourses: {
    course_name: string;
    count: number;
  }[];
}

const CHART_COLORS = [
  '#3498db', // blue
  '#2ecc71', // green
  '#e74c3c', // red
  '#f39c12', // yellow
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#d35400', // orange
  '#34495e', // navy
];

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

  const renderNoDataMessage = () => (
    <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
      No data available
    </div>
  );

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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certificate Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {!statusData.length ? (
                    renderNoDataMessage()
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => 
                              percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                            }
                          >
                            {statusData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded shadow-md">
                                    <p className="font-medium">{payload[0].name}</p>
                                    <p className="text-sm">Count: {payload[0].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  {!courseData.length ? (
                    renderNoDataMessage()
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={courseData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150} 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.toString() || 'Unknown'}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length && payload[0].payload) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border rounded shadow-md">
                                    <p className="font-medium">{data.fullName || 'Unknown'}</p>
                                    <p className="text-sm">Count: {data.value || 0}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="value" fill="#3498db" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certificates Issued Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {!monthlyData.length ? (
                  renderNoDataMessage()
                ) : (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={(value) => value.toString() || 'Unknown'}
                        />
                        <YAxis />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-medium">{label || 'Unknown'}</p>
                                  <p className="text-sm">Certificates issued: {payload[0].value || 0}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#3498db"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                          name="Certificates"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certificate Distribution by Course</CardTitle>
              </CardHeader>
              <CardContent>
                {!courseData.length ? (
                  renderNoDataMessage()
                ) : (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tickFormatter={(value) => value.toString() || 'Unknown'}
                        />
                        <YAxis />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length && payload[0].payload) {
                              const entry = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-medium">{entry.fullName || 'Unknown'}</p>
                                  <p className="text-sm">Certificates: {entry.value || 0}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#2ecc71" name="Certificate Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
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
