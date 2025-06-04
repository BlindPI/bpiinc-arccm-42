import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCRMRevenueMetrics } from '@/hooks/crm/useCRMDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const RevenueChart: React.FC = () => {
  const { data: revenueData, isLoading, error } = useCRMRevenueMetrics();

  // Process real revenue data into chart format
  const processRevenueData = () => {
    if (!revenueData || !Array.isArray(revenueData)) {
      return [];
    }

    // Transform the monthly revenue trend data for the chart
    return revenueData.map((item, index) => {
      // Convert YYYY-MM format to short month name
      const date = new Date(item.month + '-01');
      const monthName = date.toLocaleDateString('en-CA', { month: 'short' });
      
      // Calculate target as 110% of current revenue or based on growth trend
      let target = item.total_revenue * 1.1;
      
      // If we have previous month data, calculate target based on growth
      if (index > 0) {
        const previousRevenue = revenueData[index - 1].total_revenue;
        const growthRate = previousRevenue > 0 ? (item.total_revenue / previousRevenue) : 1.1;
        target = item.total_revenue * Math.max(growthRate, 1.05); // At least 5% growth target
      }
      
      return {
        month: monthName,
        revenue: item.total_revenue,
        target: Math.round(target)
      };
    });
  };

  const chartData = processRevenueData();

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Failed to load revenue data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>Monthly revenue vs targets</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'revenue' ? 'Actual Revenue' : 'Target'
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};