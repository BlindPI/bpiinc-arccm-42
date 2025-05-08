
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartProps, CHART_COLORS } from './types';
import { renderNoDataMessage, safeToString } from './ChartUtils';

interface StatusChartProps extends ChartProps {
  data: { name: string; value: number }[];
}

const StatusDistributionChart: React.FC<StatusChartProps> = ({ data }) => {
  if (!data.length) {
    return renderNoDataMessage();
  }
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => 
              percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
            }
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-medium">{payload[0].name}</p>
                    <p className="text-sm">Count: {payload[0].value}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StatusDistributionCard: React.FC<StatusChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Certificate Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          renderNoDataMessage()
        ) : (
          <StatusDistributionChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
