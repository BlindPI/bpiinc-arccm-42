
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface StatusCount {
  status: string;
  count: number;
}

interface StatusDistributionChartProps {
  data: StatusCount[];
  isLoading: boolean;
  isError: boolean;
}

const COLORS = ['#8B5CF6', '#F97316', '#0EA5E9', '#6E59A5', '#403E43'];

const STATUS_LABELS: Record<string, string> = {
  'ACTIVE': 'Active',
  'EXPIRED': 'Expired',
  'REVOKED': 'Revoked',
  'PENDING': 'Pending',
  'NO_DATA': 'No Data',
  'UNKNOWN': 'Unknown'
};

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ 
  data, 
  isLoading,
  isError 
}) => {
  // Format data for the chart
  const chartData = data.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: Number(item.count)
  }));

  if (isLoading) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Certificate Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-gray-200 mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data.length) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Certificate Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <p className="text-center text-gray-500">
            {isError ? 'Error loading data.' : 'No certificate data available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>Certificate Status Distribution</CardTitle>
        <CardDescription>Distribution of certificates by current status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} certificates`, 'Count']}
              labelFormatter={(name) => `Status: ${name}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
