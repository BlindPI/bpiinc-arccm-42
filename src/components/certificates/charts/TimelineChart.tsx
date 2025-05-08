
import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartProps } from './types';
import { renderNoDataMessage, safeToString } from './ChartUtils';

interface TimelineChartProps extends ChartProps {
  data: { month: string; count: number }[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (!data.length) {
    return renderNoDataMessage();
  }
  
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={safeToString}
          />
          <YAxis />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-medium">{label || 'Unknown'}</p>
                    <p className="text-sm">Certificates issued: {payload[0].value || 0}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3498db"
            activeDot={{ r: 8 }}
            strokeWidth={2}
            name="Certificates"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TimelineCard: React.FC<TimelineChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Certificates Issued Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          renderNoDataMessage()
        ) : (
          <TimelineChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
