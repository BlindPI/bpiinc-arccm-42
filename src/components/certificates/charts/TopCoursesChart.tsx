
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoursesChartProps } from './types';
import { renderNoDataMessage, safeToString, stringTickFormatter } from './ChartUtils';

const TopCoursesChart: React.FC<CoursesChartProps> = ({ data }) => {
  if (!data.length) {
    return renderNoDataMessage();
  }
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            tick={{ fontSize: 12 }}
            tickFormatter={stringTickFormatter}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length && payload[0].payload) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-medium">{safeToString(data.fullName || 'Unknown')}</p>
                    <p className="text-sm">Count: {data.value || 0}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" fill="#3498db" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TopCoursesCard: React.FC<CoursesChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          renderNoDataMessage()
        ) : (
          <TopCoursesChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};

export default TopCoursesChart;
