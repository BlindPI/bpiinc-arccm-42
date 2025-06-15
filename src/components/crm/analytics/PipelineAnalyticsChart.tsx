
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PipelineMetrics } from '@/types/crm';

interface PipelineAnalyticsChartProps {
  data?: PipelineMetrics[];
}

export function PipelineAnalyticsChart({ data = [] }: PipelineAnalyticsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatStage = (stage: string) => {
    return stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const chartData = data.map(stage => ({
    ...stage,
    stage_display: formatStage(stage.stage_name)
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="stage_display" 
            fontSize={12}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="count"
            orientation="left"
            fontSize={12}
          />
          <YAxis 
            yAxisId="value"
            orientation="right"
            tickFormatter={formatCurrency}
            fontSize={12}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'total_value') {
                return [formatCurrency(value as number), 'Total Value'];
              }
              return [value, name === 'opportunity_count' ? 'Opportunities' : name];
            }}
          />
          <Legend />
          <Bar 
            yAxisId="count"
            dataKey="opportunity_count" 
            fill="#3b82f6" 
            name="Opportunities"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="value"
            dataKey="total_value" 
            fill="#10b981" 
            name="Total Value"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
