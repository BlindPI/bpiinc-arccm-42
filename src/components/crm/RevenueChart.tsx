
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  chartType?: 'line' | 'bar';
  period?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  chartType = 'line',
  period = 'monthly'
}) => {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-monthly-comparison', period],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison(12)
  });

  // Transform the data to match chart format
  const chartData = (revenueData || []).map(item => ({
    month: item.month,
    revenue: item.totalRevenue,
    deals: item.deals
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty data state
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>
            Monthly revenue breakdown by closed opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No revenue data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>
          Monthly revenue from closed opportunities (Last 12 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'revenue' ? 'Total Revenue' : 'Deals Closed'
              ]}
            />
            {chartType === 'line' ? (
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="revenue"
              />
            ) : (
              <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
