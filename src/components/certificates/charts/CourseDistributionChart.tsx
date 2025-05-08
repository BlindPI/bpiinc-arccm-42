
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseDistributionProps } from './types';
import { renderNoDataMessage, safeToString } from './ChartUtils';

const CourseDistributionChart: React.FC<CourseDistributionProps> = ({ data }) => {
  if (!data.length) {
    return renderNoDataMessage();
  }
  
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tickFormatter={safeToString}
          />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length && payload[0].payload) {
                const entry = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-medium">{safeToString(entry.fullName || 'Unknown')}</p>
                    <p className="text-sm">Certificates: {entry.value || 0}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend formatter={safeToString} />
          <Bar dataKey="value" fill="#2ecc71" name="Certificate Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CourseDistributionCard: React.FC<CourseDistributionProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Certificate Distribution by Course</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          renderNoDataMessage()
        ) : (
          <CourseDistributionChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};

export default CourseDistributionChart;
