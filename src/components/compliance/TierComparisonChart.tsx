
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { AlertTriangle } from 'lucide-react';
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
  Legend
} from 'recharts';
import { useComplianceTierAnalytics } from '@/hooks/useComplianceTierAnalytics';

interface TierComparisonChartProps {
  data?: any;
  role?: string;
  isLoading?: boolean;
  comparisonType?: 'distribution' | 'completion' | 'metrics' | 'performance';
}

export function TierComparisonChart({ 
  role = 'SA',
  comparisonType = 'metrics'
}: TierComparisonChartProps) {
  const { data, isLoading, error } = useComplianceTierAnalytics();
  
  if (isLoading) {
    return <TierComparisonSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load analytics data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
            <CardTitle>Compliance Tier Analytics</CardTitle>
            <CardDescription>
              Compare performance and metrics across compliance tiers
            </CardDescription>
          </div>
          
          <Badge variant="outline" className="text-sm">
            {getRoleLabel(role)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <Tabs defaultValue={comparisonType} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="h-80">
            <TierDistributionChart data={data} />
          </TabsContent>
          
          <TabsContent value="metrics" className="h-80">
            <TierMetricsComparisonChart data={data} role={role} />
          </TabsContent>
          
          <TabsContent value="performance" className="h-80">
            <TierPerformanceChart data={data} />
          </TabsContent>
          
          <TabsContent value="completion" className="h-80">
            <TierCompletionTimeChart data={data} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TierDistributionChart({ data }: { data: any }) {
  const COLORS = ['#3B82F6', '#8B5CF6', '#9333EA'];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data?.distribution || []}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {(data?.distribution || []).map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [
            `${value} users (${((value / (data?.total || 1)) * 100).toFixed(1)}%)`, 
            'Count'
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
      <BarChart data={data?.completionTime || []}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: number) => [`${value}%`, 'Completion Rate']} 
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
      <RadarChart outerRadius={90} data={data?.metrics || []}>
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
      <LineChart data={data?.performance || []}>
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
    'AP': 'Authorized Provider',
    'SA': 'System Administrator',
    'AD': 'Administrative User'
  };
  return roles[roleCode as keyof typeof roles] || roleCode;
}
