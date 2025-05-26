
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CourseCount {
  course_name: string;
  count: number;
}

interface TopCoursesChartProps {
  data: CourseCount[];
  isLoading: boolean;
  isError: boolean;
}

const TopCoursesChart: React.FC<TopCoursesChartProps> = ({ 
  data, 
  isLoading,
  isError 
}) => {
  // Format and sort data for the chart
  const chartData = [...data]
    .sort((a, b) => Number(b.count) - Number(a.count))
    .map(item => ({
      name: item.course_name.length > 30 
        ? `${item.course_name.substring(0, 30)}...` 
        : item.course_name,
      count: Number(item.count),
      fullName: item.course_name // Keep the full name for tooltips
    }));

  if (isLoading) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Top Certificate Courses</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse w-full">
            <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-4/6 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/6 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-2/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data.length) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>Top Certificate Courses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <p className="text-center text-gray-500">
            {isError ? 'Error loading course data.' : 'No course data available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>Top Certificate Courses</CardTitle>
        <CardDescription>Most frequently certified courses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip 
              formatter={(value: number) => [`${value} certificates`, 'Count']}
              labelFormatter={(name) => {
                const item = chartData.find(item => item.name === name);
                return `Course: ${item?.fullName || name}`;
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#8B5CF6" name="Certificates Issued" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TopCoursesChart;
