
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CRMService } from '@/services/crm/crmService';
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
    queryKey: ['revenue-analytics', period],
    queryFn: () => CRMService.getCRMStats() // This would be extended to get time-series data
  });

  // Mock data for demonstration - in real implementation, this would come from the API
  const mockRevenueData = [
    { month: 'Jan', revenue: 45000, certificates: 150, training: 35000 },
    { month: 'Feb', revenue: 52000, certificates: 180, training: 42000 },
    { month: 'Mar', revenue: 48000, certificates: 165, training: 38000 },
    { month: 'Apr', revenue: 61000, certificates: 220, training: 45000 },
    { month: 'May', revenue: 55000, certificates: 190, training: 41000 },
    { month: 'Jun', revenue: 67000, certificates: 250, training: 52000 },
  ];

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

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>
          Monthly revenue breakdown by service type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={mockRevenueData}>
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
