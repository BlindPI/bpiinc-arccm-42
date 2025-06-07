
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import type { DateRange } from '@/types/crm';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

interface AdvancedRevenueAnalyticsProps {
  className?: string;
}

export function AdvancedRevenueAnalytics({ className }: AdvancedRevenueAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [comparisonPeriod, setComparisonPeriod] = useState<string>('previous_period');

  // Get default date range (last 90 days)
  React.useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 90);
    setDateRange({ from: start, to: end });
  }, []);

  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery({
    queryKey: ['advanced-revenue-metrics', dateRange?.from, dateRange?.to],
    queryFn: () => dateRange ? RevenueAnalyticsService.getRevenueMetrics(dateRange) : Promise.resolve(null),
    enabled: !!dateRange?.from && !!dateRange?.to
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-revenue-trends'],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison()
  });

  const { data: revenueBySource, isLoading: sourceLoading } = useQuery({
    queryKey: ['revenue-source-breakdown'],
    queryFn: () => RevenueAnalyticsService.getRevenueBySource()
  });

  const { data: revenueForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['revenue-forecast-advanced'],
    queryFn: () => RevenueAnalyticsService.getRevenueForecast()
  });

  // Calculate key performance indicators
  const kpis = React.useMemo(() => {
    if (!revenueMetrics) return null;

    const revenueGrowth = revenueMetrics.previousRevenue > 0 
      ? ((revenueMetrics.currentRevenue - revenueMetrics.previousRevenue) / revenueMetrics.previousRevenue) * 100
      : 0;

    return {
      totalRevenue: revenueMetrics.currentRevenue,
      revenueGrowth,
      averageDealSize: revenueMetrics.averageDealSize,
      pipelineValue: revenueMetrics.pipelineValue,
      forecastAccuracy: 85.2, // This would be calculated from historical data
      conversionRate: 23.4 // This would be calculated from leads to revenue
    };
  }, [revenueMetrics]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!monthlyData) return [];
    
    return monthlyData.map(item => ({
      month: item.month,
      revenue: item.totalRevenue,
      deals: item.deals,
      avgDealSize: item.deals > 0 ? item.totalRevenue / item.deals : 0
    }));
  }, [monthlyData]);

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (revenueLoading || monthlyLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights into revenue performance and trends
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="deals">Deal Count</SelectItem>
              <SelectItem value="avg_deal_size">Avg Deal Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {kpis && kpis.revenueGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={kpis && kpis.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(kpis?.revenueGrowth || 0).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
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
              {formatCurrency(kpis?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted by probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.averageDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per closed opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="sources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends Over Time</CardTitle>
              <CardDescription>
                Monthly revenue performance and growth patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Deals'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>
                  Distribution of revenue across lead sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                      />
                      <RechartsPieChart data={revenueBySource}>
                        {revenueBySource?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>
                  Detailed breakdown by lead source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBySource?.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <div>
                          <div className="font-medium capitalize">
                            {source.source.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {source.count} transactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(source.revenue)}</div>
                        <div className="text-sm text-muted-foreground">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>
                Projected revenue based on current pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueForecast?.map((forecast) => (
                  <div key={forecast.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{forecast.month}</div>
                        <div className="text-sm text-muted-foreground">
                          Forecast period
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(forecast.predicted)}</div>
                        <div className="text-sm text-muted-foreground">
                          {forecast.confidence}% confidence
                        </div>
                      </div>
                      <Badge 
                        variant={forecast.confidence > 70 ? "default" : "secondary"}
                      >
                        {forecast.confidence > 70 ? "High" : forecast.confidence > 40 ? "Medium" : "Low"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>
                  Performance indicators and benchmarks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Forecast Accuracy</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">{kpis?.forecastAccuracy}%</span>
                      <Badge variant="default">Excellent</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">{kpis?.conversionRate}%</span>
                      <Badge variant="secondary">Good</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">
                        {kpis?.revenueGrowth.toFixed(1)}%
                      </span>
                      <Badge variant={kpis && kpis.revenueGrowth > 0 ? "default" : "destructive"}>
                        {kpis && kpis.revenueGrowth > 0 ? "Growing" : "Declining"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Size Trends</CardTitle>
                <CardDescription>
                  Average deal size over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Avg Deal Size']}
                      />
                      <Bar dataKey="avgDealSize" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
