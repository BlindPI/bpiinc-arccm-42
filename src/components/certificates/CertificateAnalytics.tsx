
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Award, Calendar, ChartBar } from 'lucide-react';

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
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const stats = await generateBulkStats();
        setAnalyticsData(stats);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [generateBulkStats]);

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

  if (!analyticsData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>
          Could not load certificate analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Format status data for chart display
  const statusData = analyticsData.statusCounts.map((item: any) => ({
    name: item.status,
    value: parseInt(item.count)
  }));

  // Format monthly data for timeline chart
  const monthlyData = analyticsData.monthlyData.map((item: any) => ({
    month: item.month,
    count: parseInt(item.count)
  }));

  // Format course data for bar chart
  const courseData = analyticsData.topCourses.map((item: any) => ({
    name: item.course_name.length > 20 
      ? item.course_name.substring(0, 20) + '...' 
      : item.course_name,
    value: parseInt(item.count),
    fullName: item.course_name
  }));

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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border rounded shadow-md">
                                  <p className="font-medium">{payload[0].payload.fullName}</p>
                                  <p className="text-sm">Count: {payload[0].value}</p>
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
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border rounded shadow-md">
                                <p className="font-medium">{label}</p>
                                <p className="text-sm">Certificates issued: {payload[0].value}</p>
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Certificate Distribution by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={courseData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const entry = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded shadow-md">
                                <p className="font-medium">{entry.fullName}</p>
                                <p className="text-sm">Certificates: {entry.value}</p>
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
