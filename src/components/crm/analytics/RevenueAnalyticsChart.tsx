
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target } from 'lucide-react';
import type { RevenueMetrics } from '@/types/crm';

interface RevenueAnalyticsChartProps {
  data?: RevenueMetrics;
}

export function RevenueAnalyticsChart({ data }: RevenueAnalyticsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatMonth = (month: string) => {
    return new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.currentRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className={`text-sm ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(data.pipelineValue)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                Potential revenue in pipeline
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Deal Size</p>
                <p className="text-2xl font-bold">{formatCurrency(data.averageDealSize)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                Per closed opportunity
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forecast</p>
                <p className="text-2xl font-bold">{formatCurrency(data.forecastValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                {data.forecast.confidence_level}% confidence
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value as number), name === 'revenue' ? 'Revenue' : 'Target']}
                  labelFormatter={(month) => formatMonth(month as string)}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
