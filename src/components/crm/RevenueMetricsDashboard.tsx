
import React, { useState, useEffect } from 'react';
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
  Users,
  Target,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import type { DateRange } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface RevenueMetricsDashboardProps {
  className?: string;
}

export function RevenueMetricsDashboard({ className }: RevenueMetricsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Get default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setDateRange({ from: start, to: end });
  }, []);

  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-metrics', dateRange?.from, dateRange?.to],
    queryFn: () => RevenueAnalyticsService.getRevenueMetrics(dateRange!),
    enabled: !!dateRange?.from && !!dateRange?.to
  });

  const { data: pipelineMetrics, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: () => RevenueAnalyticsService.getPipelineMetrics()
  });

  const { data: revenueForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: () => RevenueAnalyticsService.getRevenueForecast()
  });

  const { data: revenueBySource, isLoading: sourceLoading } = useQuery({
    queryKey: ['revenue-by-source'],
    queryFn: () => RevenueAnalyticsService.getRevenueBySource()
  });

  const { data: monthlyComparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['monthly-revenue-comparison'],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison(12)
  });

  const totalPipelineValue = pipelineMetrics?.totalPipelineValue || 0;
  const totalForecast = revenueForecast?.reduce((sum, period) => sum + period.predicted, 0) || 0;

  if (revenueLoading || pipelineLoading) {
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
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive revenue tracking and forecasting
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueMetrics?.currentRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPipelineValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast (6 months)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalForecast)}
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted by probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueMetrics?.averageDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="sources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pipeline Stage Analysis
              </CardTitle>
              <CardDescription>
                Opportunity distribution and value across pipeline stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineMetrics?.stageDistribution?.map((stage) => (
                  <div key={stage.stage_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{stage.stage_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {stage.opportunity_count} opportunities
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(stage.total_value)}</div>
                        <div className="text-sm text-muted-foreground">
                          {stage.avg_probability}% avg probability
                        </div>
                      </div>
                      <Badge variant="outline">
                        {((stage.total_value / totalPipelineValue) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>
                Projected revenue based on opportunity probability and close dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueForecast?.map((forecast) => (
                  <div key={forecast.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{forecast.month}</span>
                        <span className="text-sm text-muted-foreground">
                          Forecast period
                        </span>
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

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue by Source
              </CardTitle>
              <CardDescription>
                Revenue breakdown by lead source channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBySource?.map((source) => (
                  <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{source.source.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">
                          {source.count} transactions
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="font-semibold">{formatCurrency(source.revenue)}</div>
                      <Badge variant="outline">
                        {source.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Revenue Trends
              </CardTitle>
              <CardDescription>
                12-month revenue comparison and growth analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyComparison?.map((month, index) => {
                  const prevMonth = monthlyComparison[index - 1];
                  const growth = prevMonth 
                    ? ((month.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue) * 100
                    : 0;
                  
                  return (
                    <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{month.month}</span>
                          <span className="text-sm text-muted-foreground">
                            {month.deals} deals
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(month.totalRevenue)}</div>
                          <div className="text-sm text-muted-foreground">
                            Total revenue
                          </div>
                        </div>
                        {index > 0 && (
                          <Badge variant={growth > 0 ? "default" : "destructive"}>
                            {growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(growth).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
