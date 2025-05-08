
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartBar, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, BarChart, Bar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';

// Chart colors
const CHART_COLORS = [
  '#3498db', // blue
  '#2ecc71', // green
  '#e74c3c', // red
  '#f39c12', // yellow
  '#9b59b6', // purple
];

// Safe string conversion helper
const safeToString = (value: any): string => {
  if (value === null || value === undefined) return 'Unknown';
  return String(value);
};

const CertificateAnalytics = () => {
  const { data, isLoading, error } = useCertificateAnalytics();
  
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
          {error instanceof Error ? error.message : "An error occurred while loading analytics"}. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Early return for no data state
  if (!data || (
    (!data.statusCounts || data.statusCounts.length === 0) && 
    (!data.monthlyData || data.monthlyData.length === 0) && 
    (!data.topCourses || data.topCourses.length === 0)
  )) {
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
    <Card className="border shadow-md bg-gradient-to-br from-white to-gray-50/80">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ChartBar className="h-5 w-5 text-primary" />
          Certificate Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Two-column layout for status and top courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificate Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {!data.statusCounts || data.statusCounts.length === 0 ? (
                <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusCounts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        dataKey="count"
                        nameKey="status"
                        label={({ status, percent }) => 
                          percent > 0 ? `${safeToString(status)}: ${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {data.statusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [Number(value), 'Count']}
                        labelFormatter={(label) => safeToString(label)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Courses Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {!data.topCourses || data.topCourses.length === 0 ? (
                <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topCourses}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="course_name" 
                        type="category" 
                        width={150} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [Number(value), 'Count']} 
                        labelFormatter={(label) => safeToString(label)}
                      />
                      <Bar dataKey="count" fill="#3498db" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Full-width timeline */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Certificates Issued Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.monthlyData || data.monthlyData.length === 0 ? (
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [Number(value), 'Certificates']} 
                      labelFormatter={(label) => safeToString(label)}
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
      </CardContent>
    </Card>
  );
};

export default CertificateAnalytics;
