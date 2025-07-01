
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Activity,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useAdvancedAnalyticsTrends } from '@/hooks/useAdvancedAnalyticsTrends';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ExecutiveDashboardProps {
  className?: string;
}

export function ExecutiveDashboard({ className }: ExecutiveDashboardProps) {
  const { data: trends, isLoading: trendsLoading } = useAdvancedAnalyticsTrends();
  const { healthMetrics, loading: healthLoading, isHealthy } = useSystemHealth();

  // Mock executive KPIs - in a real implementation these would come from actual services
  const executiveKPIs = React.useMemo(() => {
    return {
      totalRevenue: 2450000,
      pipelineValue: 4800000,
      forecastValue: 3200000,
      conversion_rate: 15.8,
      win_rate: 68.5,
      average_deal_size: 125000,
      total_leads: 1247,
      total_opportunities: 89,
      quarterlyGrowth: 15.2,
      customerAcquisitionCost: 2500,
      customerLifetimeValue: 45000
    };
  }, []);

  // Mock revenue data
  const monthlyRevenue = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      totalRevenue: Math.random() * 500000 + 100000
    }));
  }, []);

  if (trendsLoading || healthLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Executive Summary Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">
          Strategic overview of business performance and key metrics
        </p>
      </div>

      {/* System Health Alert */}
      {!isHealthy && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-destructive font-medium">
              System health warning detected - Response time: {healthMetrics?.responseTime}ms
            </span>
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(executiveKPIs.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{executiveKPIs.quarterlyGrowth}% this quarter
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              {trends?.certificatesTrend || '0% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              {trends?.instructorsTrend || '0% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <Progress value={94.2} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {trends?.complianceTrend || '0% from last month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue performance over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalRevenue" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Uptime</span>
                <Badge variant={isHealthy ? "default" : "destructive"}>
                  {healthMetrics?.uptime.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm">{healthMetrics?.responseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm">{healthMetrics?.errorRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Users</span>
                <span className="text-sm">{healthMetrics?.activeUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Executive Alerts
          </CardTitle>
          <CardDescription>
            Key issues requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">System issues detected: {trends?.issuesCount || 0}</span>
              </div>
              <Badge variant="outline">
                {trends?.issuesTrend || '0% from last week'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Compliance rate improved this month</span>
              </div>
              <Badge variant="default">Good News</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">New instructor certifications pending review</span>
              </div>
              <Badge variant="secondary">Action Required</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutiveDashboard;
