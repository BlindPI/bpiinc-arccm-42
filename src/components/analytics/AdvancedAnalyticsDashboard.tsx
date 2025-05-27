
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, Users, FileText, AlertTriangle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import { SecurityService } from '@/services/security/securityService';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [groupBy, setGroupBy] = useState('day');

  const { data: certificateTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['certificate-trends', timeRange, groupBy],
    queryFn: () => AnalyticsService.getCertificateTrends(parseInt(timeRange), groupBy)
  });

  const { data: instructorMetrics, isLoading: instructorLoading } = useQuery({
    queryKey: ['instructor-metrics'],
    queryFn: () => AnalyticsService.getInstructorPerformanceMetrics()
  });

  const { data: complianceOverview, isLoading: complianceLoading } = useQuery({
    queryKey: ['compliance-overview'],
    queryFn: () => AnalyticsService.getComplianceOverview()
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['status-distribution'],
    queryFn: () => AnalyticsService.getCertificateStatusDistribution()
  });

  const { data: topCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['top-courses'],
    queryFn: () => AnalyticsService.getTopCourses(10)
  });

  const { data: securitySummary, isLoading: securityLoading } = useQuery({
    queryKey: ['security-summary'],
    queryFn: () => SecurityService.getSecuritySummary()
  });

  const handleExportData = async (dataType: string) => {
    try {
      let data: any;
      let filename: string;

      switch (dataType) {
        case 'trends':
          data = certificateTrends;
          filename = 'certificate-trends.json';
          break;
        case 'instructors':
          data = instructorMetrics;
          filename = 'instructor-metrics.json';
          break;
        case 'compliance':
          data = complianceOverview;
          filename = 'compliance-overview.json';
          break;
        default:
          return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const formatChartData = (data: any[], xKey: string, yKey: string) => {
    return data?.map(item => ({
      ...item,
      [xKey]: new Date(item[xKey]).toLocaleDateString(),
      [yKey]: Number(item[yKey])
    })) || [];
  };

  const formatDistributionData = (data: Record<string, number>) => {
    return Object.entries(data || {}).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {certificateTrends?.reduce((sum, item) => sum + item.total_certificates, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {instructorMetrics?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently teaching
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {complianceOverview ? 
                    Math.round(
                      Object.values(complianceOverview).reduce((acc: number, role: any) => 
                        acc + (role.compliant / role.total * 100), 0
                      ) / Object.keys(complianceOverview).length
                    ) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across roles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securitySummary?.totalEvents || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Trends Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Certificate Trends</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportData('trends')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(certificateTrends || [], 'period_start', 'total_certificates')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period_start" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total_certificates" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total Certificates"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_certificates" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Active Certificates"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatDistributionData(statusDistribution)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatDistributionData(statusDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCourses || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="course_name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Instructor Performance</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportData('instructors')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instructorMetrics?.slice(0, 10).map((instructor: any) => (
                  <div key={instructor.instructor_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{instructor.display_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{instructor.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {instructor.total_hours_all_time?.toFixed(1) || 0}h
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {instructor.total_sessions_all_time || 0} sessions
                      </div>
                      <div className="text-sm">
                        {instructor.compliance_percentage?.toFixed(0) || 0}% compliant
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Events by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatDistributionData(securitySummary?.eventsBySeverity || {})}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Pages by Access */}
            <Card>
              <CardHeader>
                <CardTitle>Most Accessed Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securitySummary?.topPages?.slice(0, 10).map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{page.page}</span>
                      <span className="text-sm text-muted-foreground">{page.count} visits</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {securitySummary?.uniqueUsers || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {securitySummary?.totalSessions || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {securitySummary?.totalEvents || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Security Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
