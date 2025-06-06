import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';

interface RevenueMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  target?: string;
  status: 'on-track' | 'at-risk' | 'exceeded';
}

interface ForecastData {
  period: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface AdvancedRevenueAnalyticsProps {
  className?: string;
}

export function AdvancedRevenueAnalytics({ className }: AdvancedRevenueAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [forecastPeriod, setForecastPeriod] = useState('90d');
  const [refreshing, setRefreshing] = useState(false);

  // Calculate date range based on timeRange
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange(timeRange);

  // Fetch revenue metrics
  const { data: revenueData, isLoading: revenueLoading, refetch } = useQuery({
    queryKey: ['revenue-metrics', startDate, endDate],
    queryFn: () => RevenueAnalyticsService.getRevenueMetrics(startDate, endDate),
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch revenue forecast
  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['revenue-forecast', forecastPeriod],
    queryFn: () => {
      const periods = forecastPeriod === '30d' ? 1 : forecastPeriod === '90d' ? 3 : forecastPeriod === '6m' ? 6 : 12;
      return RevenueAnalyticsService.getRevenueForecast(periods);
    },
  });

  // Fetch revenue by source
  const { data: sourceData, isLoading: sourceLoading } = useQuery({
    queryKey: ['revenue-by-source', startDate, endDate],
    queryFn: () => RevenueAnalyticsService.getRevenueBySource(startDate, endDate),
  });

  // Fetch monthly comparison
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-revenue-comparison'],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison(12),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Process revenue data from the array
  const currentPeriodData = revenueData?.[0];
  const totalRevenue = currentPeriodData?.total_revenue || 0;
  const certificateRevenue = currentPeriodData?.certificate_revenue || 0;
  const corporateRevenue = currentPeriodData?.corporate_revenue || 0;
  const transactionCount = currentPeriodData?.transaction_count || 0;

  // Calculate average deal size
  const avgDealSize = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  const revenueMetrics: RevenueMetric[] = [
    {
      title: 'Total Revenue',
      value: totalRevenue ? `$${(totalRevenue / 1000).toFixed(1)}K` : '$0',
      change: 12.5, // Mock data - would need historical comparison
      changeType: 'increase',
      target: `$${((totalRevenue * 1.2) / 1000).toFixed(1)}K`,
      status: 'on-track'
    },
    {
      title: 'Certificate Revenue',
      value: certificateRevenue ? `$${(certificateRevenue / 1000).toFixed(1)}K` : '$0',
      change: 8.3,
      changeType: 'increase',
      target: `$${((certificateRevenue * 1.15) / 1000).toFixed(1)}K`,
      status: 'on-track'
    },
    {
      title: 'Corporate Revenue',
      value: corporateRevenue ? `$${(corporateRevenue / 1000).toFixed(1)}K` : '$0',
      change: 15.7,
      changeType: 'increase',
      status: 'exceeded'
    },
    {
      title: 'Average Deal Size',
      value: avgDealSize ? `$${avgDealSize.toLocaleString()}` : '$0',
      change: 5.2,
      changeType: 'increase',
      status: 'on-track'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-green-500';
      case 'at-risk':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const isLoading = revenueLoading || forecastLoading || sourceLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive revenue insights and forecasting
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

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              {getStatusIcon(metric.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.target && (
                <div className="text-sm text-muted-foreground">
                  Target: {metric.target}
                </div>
              )}
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
              <Badge 
                variant="secondary" 
                className={`mt-2 ${getStatusColor(metric.status)}`}
              >
                {metric.status.replace('-', ' ')}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
          <TabsTrigger value="sources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
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
                      <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue trend chart</p>
                      <p className="text-sm">Chart integration needed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Growth Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Rate
                </CardTitle>
                <CardDescription>
                  Month-over-month growth analysis
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
                      <p>Growth rate analysis</p>
                      <p className="text-sm">Chart integration needed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Settings</CardTitle>
                <CardDescription>
                  Configure forecasting parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Forecast Period</label>
                  <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">Next 30 days</SelectItem>
                      <SelectItem value="90d">Next 90 days</SelectItem>
                      <SelectItem value="6m">Next 6 months</SelectItem>
                      <SelectItem value="1y">Next year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Level</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Revenue Forecast
                </CardTitle>
                <CardDescription>
                  Predicted revenue with confidence intervals
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
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue forecasting chart</p>
                      <p className="text-sm">Predictive analytics visualization</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Source
                </CardTitle>
                <CardDescription>
                  Revenue breakdown by acquisition channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceData?.map((source: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                        />
                        <span className="text-sm font-medium">{source.source || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${(source.total_revenue / 1000).toFixed(1)}K
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {source.count} transactions
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No revenue source data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Accounts</CardTitle>
                <CardDescription>
                  Highest revenue generating accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData?.slice(0, 5).map((month: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{month.month}</p>
                        <p className="text-xs text-muted-foreground">{month.transaction_count} transactions</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${(month.total_revenue / 1000).toFixed(1)}K
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No monthly data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deep Revenue Analysis</CardTitle>
              <CardDescription>
                Advanced analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Advanced Revenue Analytics</h3>
                <p>Cohort analysis, customer lifetime value, churn impact</p>
                <p className="text-sm mt-2">Deep analytics features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}