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
import { CRMService } from '@/services/crm/enhancedCRMService';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
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
  const { data: crmStats, isLoading: statsLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => CRMService.getCRMStats()
  });

  const { data: pipelineMetrics, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: () => RevenueAnalyticsService.getPipelineMetrics()
  });

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison()
  });

  const { data: revenueForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: () => RevenueAnalyticsService.getRevenueForecast()
  });

  // Calculate executive KPIs
  const executiveKPIs = React.useMemo(() => {
    if (!crmStats || !pipelineMetrics) return null;

    const totalRevenue = monthlyRevenue?.reduce((sum, month) => sum + month.totalRevenue, 0) || 0;
    const totalForecast = revenueForecast?.reduce((sum, period) => sum + period.predicted, 0) || 0;
    
    return {
      totalRevenue,
      pipelineValue: pipelineMetrics.totalPipelineValue,
      forecastValue: totalForecast,
      conversion_rate: crmStats.conversion_rate,
      win_rate: crmStats.win_rate,
      average_deal_size: crmStats.average_deal_size,
      total_leads: crmStats.total_leads,
      total_opportunities: crmStats.total_opportunities,
      quarterlyGrowth: 15.2, // This would be calculated from historical data
      customerAcquisitionCost: 2500, // This would be calculated from marketing spend
      customerLifetimeValue: 45000 // This would be calculated from customer data
    };
  }, [crmStats, pipelineMetrics, monthlyRevenue, revenueForecast]);

  if (statsLoading || pipelineLoading) {
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(executiveKPIs?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{executiveKPIs?.quarterlyGrowth}% this quarter
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(executiveKPIs?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {executiveKPIs?.total_opportunities} active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveKPIs?.win_rate.toFixed(1)}%
            </div>
            <Progress value={executiveKPIs?.win_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(executiveKPIs?.average_deal_size || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per closed opportunity
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

        {/* Pipeline Health */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
            <CardDescription>
              Opportunity distribution across pipeline stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineMetrics?.stageDistribution?.map((stage) => (
                <div key={stage.stage_name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {stage.stage_name}
                    </span>
                    <Badge variant="outline">
                      {stage.opportunity_count} opportunities
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(stage.total_value)}</span>
                    <span>{stage.avg_probability}% avg probability</span>
                  </div>
                  <Progress 
                    value={(stage.total_value / (pipelineMetrics.totalPipelineValue || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Leads</span>
              <span className="font-semibold">{executiveKPIs?.total_leads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Conversion Rate</span>
              <span className="font-semibold">{executiveKPIs?.conversion_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Customer LTV</span>
              <span className="font-semibold">{formatCurrency(executiveKPIs?.customerLifetimeValue || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Opportunities</span>
              <span className="font-semibold">{executiveKPIs?.total_opportunities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Win Rate</span>
              <span className="font-semibold">{executiveKPIs?.win_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Acquisition Cost</span>
              <span className="font-semibold">{formatCurrency(executiveKPIs?.customerAcquisitionCost || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Next Quarter</span>
              <span className="font-semibold">{formatCurrency(executiveKPIs?.forecastValue || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pipeline Coverage</span>
              <Badge variant={
                (executiveKPIs?.pipelineValue || 0) > (executiveKPIs?.forecastValue || 0) * 3 
                  ? "default" 
                  : "destructive"
              }>
                {(((executiveKPIs?.pipelineValue || 0) / (executiveKPIs?.forecastValue || 1)) * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Forecast Confidence</span>
              <Badge variant="secondary">High</Badge>
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
                <span className="text-sm">Pipeline coverage below target for next quarter</span>
              </div>
              <Badge variant="outline">Medium Priority</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Win rate increased by 5% this month</span>
              </div>
              <Badge variant="default">Good News</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">New market segment showing 25% growth</span>
              </div>
              <Badge variant="secondary">Opportunity</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
