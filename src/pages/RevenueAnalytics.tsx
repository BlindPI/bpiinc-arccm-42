
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Download, Calendar, BarChart3 } from 'lucide-react';
import { CRMService } from '@/services/crm/crmService';
import { formatCurrency } from '@/lib/utils';
import { RevenueChart } from '@/components/crm/RevenueChart';

export default function RevenueAnalytics() {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [period, setPeriod] = useState('monthly');

  const { data: revenueStats, isLoading } = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: CRMService.getCRMStats
  });

  // Mock additional revenue metrics for demonstration
  const mockMetrics = {
    totalRevenue: 345000,
    pipelineValue: 890000,
    conversionRate: 24.5,
    avgDealSize: 15750,
    monthlyGrowth: 12.3,
    quarterlyGrowth: 34.7
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive revenue analysis, forecasting, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
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
            <div className="text-2xl font-bold">{formatCurrency(mockMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockMetrics.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockMetrics.pipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockMetrics.quarterlyGrowth}%</span> from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockMetrics.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Revenue Trends</h3>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                Line Chart
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Bar Chart
              </Button>
            </div>
          </div>
          <RevenueChart chartType={chartType} period={period} />
        </div>

        <div className="space-y-6">
          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
              <CardDescription>By service type this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Certificate Sales</span>
                <span className="text-sm">{formatCurrency(145000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Training Contracts</span>
                <span className="text-sm">{formatCurrency(180000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '52%' }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AP Setup Fees</span>
                <span className="text-sm">{formatCurrency(20000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '6%' }}></div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deals Closed This Month</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Opportunities</span>
                <span className="font-medium">47</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Forecast Accuracy</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sales Cycle (avg)</span>
                <span className="font-medium">45 days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
