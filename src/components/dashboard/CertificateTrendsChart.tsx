
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

interface TrendData {
  month: string;
  year: number;
  count: number;
}

interface CertificateTrendsChartProps {
  data?: TrendData[];
}

export function CertificateTrendsChart({ data }: CertificateTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading chart data...</p>
      </div>
    );
  }
  
  // Format the data for the chart
  const chartData = data.map(item => ({
    name: `${item.month} ${item.year}`,
    certificates: item.count,
  }));
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} certificates`, 'Count']}
            contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend />
          <Bar dataKey="certificates" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
