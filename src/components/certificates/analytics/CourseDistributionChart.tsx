
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsItem } from '@/hooks/useCertificateAnalytics';

interface CourseChartProps {
  data: AnalyticsItem[];
}

export const CourseDistributionChart: React.FC<CourseChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificates by Course</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-gray-500">
          No course data available
        </CardContent>
      </Card>
    );
  }

  // Sort courses by number of certificates (descending)
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Courses by Certificates</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'Certificates']}
              labelFormatter={(name) => {
                const item = sortedData.find(d => d.name === name);
                return item?.fullName || name;
              }}
            />
            <Bar dataKey="value" fill="#2ecc71" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
