
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EnhancedCRMService } from '@/services/crm/enhancedCRMService';
import type { DateRange } from '@/types/crm';

interface DateRangeLocal {
  from: Date;
  to: Date;
}

export const AdvancedRevenueAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeLocal>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    to: new Date()
  });

  const { data: revenueMetrics, isLoading } = useQuery({
    queryKey: ['revenue-metrics', dateRange.from, dateRange.to],
    queryFn: () => EnhancedCRMService.getRevenueMetrics({
      start: dateRange.from,
      end: dateRange.to
    } as DateRange)
  });

  const { data: pipelineMetrics } = useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: () => EnhancedCRMService.getPipelineMetrics()
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive revenue analysis and forecasting
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Revenue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueMetrics?.currentRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueMetrics?.growthRate ? (
                <span className={revenueMetrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {revenueMetrics.growthRate >= 0 ? '+' : ''}{revenueMetrics.growthRate.toFixed(1)}% from last period
                </span>
              ) : (
                'No previous data'
              )}
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
              {formatCurrency(revenueMetrics?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Open opportunities
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
              {formatCurrency(revenueMetrics?.averageDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per closed deal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueMetrics?.forecastValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Analysis</CardTitle>
          <CardDescription>
            Revenue distribution across pipeline stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineMetrics?.stageDistribution?.map((stage) => (
              <div key={stage.stage_name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{stage.stage_name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {stage.opportunity_count} opportunities
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Avg. Probability: {stage.avg_probability}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatCurrency(stage.total_value)}
                  </div>
                </div>
              </div>
            ))}

            {(!pipelineMetrics?.stageDistribution || pipelineMetrics.stageDistribution.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No pipeline data available for the selected period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Revenue:</span>
                <span className="font-bold">{formatCurrency(revenueMetrics?.currentRevenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Previous Period:</span>
                <span className="font-medium">{formatCurrency(revenueMetrics?.previousRevenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Growth Rate:</span>
                <span className={`font-medium ${(revenueMetrics?.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(revenueMetrics?.growthRate || 0) >= 0 ? '+' : ''}{(revenueMetrics?.growthRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Pipeline:</span>
                <span className="font-bold">{formatCurrency(pipelineMetrics?.totalPipelineValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Weighted Pipeline:</span>
                <span className="font-medium">{formatCurrency(pipelineMetrics?.weightedPipelineValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg. Close Time:</span>
                <span className="font-medium">{pipelineMetrics?.averageCloseTime || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Conversion Rate:</span>
                <span className="font-medium">{(pipelineMetrics?.conversionRate || 0).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
