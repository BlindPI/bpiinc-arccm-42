import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdvancedAnalyticsService } from '@/services/crm/advancedAnalyticsService';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { useTeamScopedDashboardData } from '@/hooks/dashboard/useTeamScopedDashboardData';

interface KPIMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

interface ExecutiveDashboardProps {
  className?: string;
}

export function ExecutiveDashboard({ className }: ExecutiveDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Use team-scoped dashboard data instead of global queries
  const {
    metrics,
    dashboardAccess,
    canAccessGlobalAnalytics,
    isTeamRestricted,
    dashboardType,
    isLoading: teamDataLoading,
    refetch: refetchTeamData
  } = useTeamScopedDashboardData();

  // Conditionally fetch advanced analytics only for authorized users
  const { data: kpiData, isLoading: kpiLoading, refetch: refetchKPIs } = useQuery({
    queryKey: ['executive-kpis', timeRange],
    queryFn: () => AdvancedAnalyticsService.getExecutiveKPIs(timeRange),
    enabled: canAccessGlobalAnalytics,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => RevenueAnalyticsService.getRevenueAnalytics(timeRange),
    enabled: canAccessGlobalAnalytics,
  });

  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline-health', timeRange],
    queryFn: () => AdvancedAnalyticsService.getPipelineHealth(),
    enabled: canAccessGlobalAnalytics,
  });

  const { data: conversionData, isLoading: conversionLoading } = useQuery({
    queryKey: ['conversion-metrics', timeRange],
    queryFn: () => AdvancedAnalyticsService.getConversionMetrics(timeRange),
    enabled: canAccessGlobalAnalytics,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTeamData(),
      ...(canAccessGlobalAnalytics ? [refetchKPIs()] : [])
    ]);
    setRefreshing(false);
  };

  // Show team-restricted dashboard for non-admin users
  if (isTeamRestricted) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
            <p className="text-muted-foreground">
              Your team's performance metrics and insights
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Team KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.organizationUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Certificates
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeCertifications || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active certifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.expiringSoon || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Expiring within 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compliance Issues
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.complianceIssues || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Open compliance issues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Dashboard Notice */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Team Dashboard</h3>
              <p>You are viewing data for your team and location only.</p>
              <p className="text-sm mt-2">Dashboard Type: {dashboardType}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiMetrics: KPIMetric[] = [
    {
      title: 'Total Revenue',
      value: revenueData?.totalRevenue ? `$${(revenueData.totalRevenue / 1000).toFixed(1)}K` : '$0',
      change: revenueData?.revenueGrowth || 0,
      changeType: (revenueData?.revenueGrowth || 0) >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      description: 'Total revenue for selected period'
    },
    {
      title: 'Active Accounts',
      value: kpiData?.activeAccounts?.toString() || '0',
      change: kpiData?.accountGrowth || 0,
      changeType: (kpiData?.accountGrowth || 0) >= 0 ? 'increase' : 'decrease',
      icon: Users,
      description: 'Number of active customer accounts'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionData?.overallConversionRate?.toFixed(1) || '0'}%`,
      change: conversionData?.conversionRateChange || 0,
      changeType: (conversionData?.conversionRateChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Target,
      description: 'Lead to customer conversion rate'
    },
    {
      title: 'Pipeline Value',
      value: pipelineData?.totalPipelineValue ? `$${(pipelineData.totalPipelineValue / 1000).toFixed(1)}K` : '$0',
      change: pipelineData?.pipelineGrowth || 0,
      changeType: (pipelineData?.pipelineGrowth || 0) >= 0 ? 'increase' : 'decrease',
      icon: Activity,
      description: 'Total value in sales pipeline'
    }
  ];

  const isLoading = kpiLoading || revenueLoading || pipelineLoading || conversionLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            High-level performance metrics and key insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {metric.changeType === 'increase' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="ml-1">vs last period</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Revenue performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue trend chart will be rendered here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Pipeline Distribution
                </CardTitle>
                <CardDescription>
                  Opportunities by stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pipelineData?.stageDistribution?.map((stage: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                          />
                          <span className="text-sm font-medium">{stage.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${(stage.value / 1000).toFixed(1)}K
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stage.count} deals
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-8">
                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No pipeline data available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest CRM activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpiData?.recentActivities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    <Badge variant="secondary">{activity.type}</Badge>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Detailed revenue performance and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Advanced Revenue Analytics</h3>
                <p>Detailed revenue charts and forecasting will be implemented here</p>
                <p className="text-sm mt-2">Integration with RevenueAnalyticsService</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Health</CardTitle>
              <CardDescription>
                Sales pipeline analysis and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Pipeline Health Analytics</h3>
                <p>Pipeline velocity, conversion rates, and health metrics</p>
                <p className="text-sm mt-2">Advanced pipeline analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Team and individual performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Performance Dashboard</h3>
                <p>Sales team performance, individual metrics, and goal tracking</p>
                <p className="text-sm mt-2">Performance analytics in development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
