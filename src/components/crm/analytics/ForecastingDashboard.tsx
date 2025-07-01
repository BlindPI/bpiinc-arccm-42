
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';
import type { DateRange } from '@/types/crm';

interface ForecastingDashboardProps {
  dateRange: DateRange;
}

export function ForecastingDashboard({ dateRange }: ForecastingDashboardProps) {
  // Sample forecasting data - in real implementation this would come from ML models
  const forecastData = [
    { month: '2024-01', actual: 450000, forecast: 420000, target: 500000 },
    { month: '2024-02', actual: 520000, forecast: 510000, target: 500000 },
    { month: '2024-03', actual: 480000, forecast: 475000, target: 500000 },
    { month: '2024-04', actual: null, forecast: 580000, target: 550000 },
    { month: '2024-05', actual: null, forecast: 620000, target: 600000 },
    { month: '2024-06', actual: null, forecast: 650000, target: 650000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatMonth = (month: string) => {
    return new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Q2 Forecast</p>
                <p className="text-2xl font-bold">$1.85M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">85% confidence</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Achievement</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">On track to meet targets</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                <p className="text-2xl font-bold">Low</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">Based on pipeline health</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast vs Actuals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : 'Target'
                  ]}
                  labelFormatter={(month) => formatMonth(month as string)}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="actual"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="forecast"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  strokeDasharray="10 5"
                  strokeWidth={2}
                  name="target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
