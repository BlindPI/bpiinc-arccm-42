
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

  // Transform the real data to match chart format
  const chartData = (revenueData || []).map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: item.total_revenue,
    certificates: item.certificate_revenue,
    training: item.corporate_revenue
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
            Monthly revenue breakdown by service type
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
          Monthly revenue breakdown by service type (Last 12 months)
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
                name === 'revenue' ? 'Total Revenue' : 
                name === 'certificates' ? 'Certificate Revenue' : 'Training Revenue'
              ]}
            />
            {chartType === 'line' ? (
              <>
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="certificates" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="certificates"
                />
                <Line 
                  type="monotone" 
                  dataKey="training" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="training"
                />
              </>
            ) : (
              <>
                <Bar dataKey="certificates" fill="#82ca9d" name="certificates" />
                <Bar dataKey="training" fill="#ffc658" name="training" />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
