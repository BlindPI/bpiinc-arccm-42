
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface MonthlyTrend {
  month: string;
  year: number;
  count: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrend[];
  isLoading: boolean;
  isError: boolean;
  showFullDetail?: boolean; // Added the optional prop
}

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ 
  data, 
  isLoading,
  isError,
  showFullDetail = false // Default to false
}) => {
  // Format data for the chart
  const chartData = data.map(item => ({
    name: `${item.month} ${item.year}`,
    count: Number(item.count),
    month: item.month,
    year: item.year
  }));

  if (isLoading) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Monthly Certificate Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data.length) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Monthly Certificate Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <p className="text-center text-gray-500">
            {isError ? 'Error loading trend data.' : 'No certificate trend data available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>Monthly Certificate Trends</CardTitle>
        <CardDescription>Number of certificates issued per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value} certificates`, 'Issued']}
              labelFormatter={(name) => `Period: ${name}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#8B5CF6" 
              name="Certificates Issued" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendsChart;
