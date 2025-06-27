// File: src/components/analytics/TierComparisonChart.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface TierComparisonChartProps {
  data?: any;
  role?: string;
  isLoading?: boolean;
  comparisonType?: 'distribution' | 'completion' | 'metrics' | 'performance';
}

export function TierComparisonChart({ 
  data, 
  role = 'IT',
  isLoading = false,
  comparisonType = 'metrics'
}: TierComparisonChartProps) {
  // If loading or no data, show skeleton
  if (isLoading || !data) {
    return <TierComparisonSkeleton />;
  }
  
  // Render different chart types based on comparisonType
  const renderChart = () => {
    switch (comparisonType) {
      case 'distribution':
        return <TierDistributionChart data={data} />;
      case 'completion':
        return <TierCompletionTimeChart data={data} />;
      case 'performance':
        return <TierPerformanceChart data={data} />;
      case 'metrics':
      default:
        return <TierMetricsComparisonChart data={data} role={role} />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tier Comparison</CardTitle>
            <CardDescription>
              Compare metrics across basic and robust tiers
            </CardDescription>
          </div>
          
          <Badge variant="outline" className="text-sm">
            {getRoleLabel(role)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="h-80">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}

function TierDistributionChart({ data }: { data: any }) {
  // Prepare data for PieChart
  const COLORS = ['#3B82F6', '#8B5CF6', '#9333EA'];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.distribution}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.distribution.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number, name: string) => [
            `${value} users (${((value / data.total) * 100).toFixed(1)}%)`, 
            name
          ]} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TierCompletionTimeChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.completionTime}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: number) => [`${value} days`, 'Avg. Completion Time']} 
        />
        <Legend />
        <Bar name="Basic Tier" dataKey="basic" fill="#3B82F6" />
        <Bar name="Robust Tier" dataKey="robust" fill="#8B5CF6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TierMetricsComparisonChart({ data, role }: { data: any, role: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart outerRadius={90} data={data.metrics}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis />
        <Radar 
          name="Basic Tier" 
          dataKey="basic" 
          stroke="#3B82F6" 
          fill="#3B82F6" 
          fillOpacity={0.2} 
        />
        <Radar 
          name="Robust Tier" 
          dataKey="robust" 
          stroke="#8B5CF6" 
          fill="#8B5CF6"
          fillOpacity={0.2} 
        />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function TierPerformanceChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.performance}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="basic" 
          name="Basic Tier" 
          stroke="#3B82F6" 
          activeDot={{ r: 8 }} 
        />
        <Line 
          type="monotone" 
          dataKey="robust" 
          name="Robust Tier" 
          stroke="#8B5CF6" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TierComparisonSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
          <div className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-4 w-32 mt-4 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get full role label
function getRoleLabel(roleCode: string) {
  const roles = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Authorized Provider'
  };
  return roles[roleCode as keyof typeof roles] || roleCode;
}