
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState('certificates');
  
  const { certificateTrends, instructorMetrics, complianceOverview, isLoading } = useAdvancedAnalytics();

  const { data: certificateDistribution } = useQuery({
    queryKey: ['certificate-distribution'],
    queryFn: () => AnalyticsService.getCertificateStatusDistribution()
  });

  const { data: topCourses } = useQuery({
    queryKey: ['top-courses'],
    queryFn: () => AnalyticsService.getTopCourses(10)
  });

  const handleExportData = async () => {
    try {
      console.log('Exporting analytics data...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Process certificate distribution data for pie chart
  const distributionData = certificateDistribution ? 
    Object.entries(certificateDistribution).map(([status, count]) => ({
      name: status,
      value: Number(count) || 0
    })) : [];

  // Process instructor metrics for display - fix the slice error
  const instructorData = Array.isArray(instructorMetrics) ? 
    instructorMetrics.slice(0, 10).map((instructor: any) => ({
      name: instructor.display_name || 'Unknown',
      hours: Number(instructor.total_hours_all_time) || 0,
      sessions: Number(instructor.total_sessions_all_time) || 0,
      compliance: Number(instructor.compliance_percentage) || 0
    })) : [];

  // Process compliance overview with proper null checking
  const complianceData = complianceOverview ? 
    Object.entries(complianceOverview).map(([role, data]: [string, any]) => {
      // Add null checking for data
      const roleData = data || {};
      const total = Number(roleData.total) || 0;
      const compliant = Number(roleData.compliant) || 0;
      const nonCompliant = Number(roleData.non_compliant) || 0;
      
      return {
        role,
        total,
        compliant,
        nonCompliant,
        complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0
      };
    }) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters & Time Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange 
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificates">Certificates</SelectItem>
                  <SelectItem value="instructors">Instructors</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="courses">Courses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distributionData.reduce((sum, item) => sum + item.value, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{instructorData.length}</div>
                <p className="text-xs text-muted-foreground">
                  +3% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Compliance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {complianceData.length > 0 
                    ? Math.round(complianceData.reduce((sum, item) => sum + item.complianceRate, 0) / complianceData.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  -2 from last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate Status Distribution</CardTitle>
              <CardDescription>
                Current distribution of certificate statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Trends</CardTitle>
              <CardDescription>Certificate generation over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={certificateTrends?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period_start" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_certificates" 
                    stroke="#8884d8" 
                    name="Total Certificates"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_certificates" 
                    stroke="#82ca9d" 
                    name="Active Certificates"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Instructors by Teaching Hours</CardTitle>
              <CardDescription>Most active instructors in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={instructorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#8884d8" name="Teaching Hours" />
                  <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance by Role</CardTitle>
              <CardDescription>Compliance rates across different user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compliant" fill="#82ca9d" name="Compliant" />
                  <Bar dataKey="nonCompliant" fill="#ff8042" name="Non-Compliant" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
