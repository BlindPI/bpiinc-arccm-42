
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingUp, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

export function InteractiveCharts() {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie'>('line');
  const [timeRange, setTimeRange] = useState('30');
  const [dataSource, setDataSource] = useState('certificates');

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['analytics-charts', dataSource, timeRange],
    queryFn: async (): Promise<ChartData[]> => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      switch (dataSource) {
        case 'certificates':
          const { data: certData } = await supabase
            .from('certificates')
            .select('created_at, status, course_name')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

          return certData?.reduce((acc: ChartData[], cert) => {
            const date = new Date(cert.created_at).toLocaleDateString();
            const existing = acc.find(item => item.name === date);
            if (existing) {
              existing.value += 1;
            } else {
              acc.push({ name: date, value: 1, date });
            }
            return acc;
          }, []) || [];

        case 'users':
          const { data: userData } = await supabase
            .from('profiles')
            .select('created_at, role')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

          return userData?.reduce((acc: ChartData[], user) => {
            const date = new Date(user.created_at).toLocaleDateString();
            const existing = acc.find(item => item.name === date);
            if (existing) {
              existing.value += 1;
            } else {
              acc.push({ name: date, value: 1, date });
            }
            return acc;
          }, []) || [];

        case 'courses':
          const { data: courseData } = await supabase
            .from('courses')
            .select('created_at, name, status')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

          return courseData?.reduce((acc: ChartData[], course) => {
            const date = new Date(course.created_at).toLocaleDateString();
            const existing = acc.find(item => item.name === date);
            if (existing) {
              existing.value += 1;
            } else {
              acc.push({ name: date, value: 1, date });
            }
            return acc;
          }, []) || [];

        default:
          return [];
      }
    }
  });

  const renderChart = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Interactive Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="certificates">Certificates</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="courses">Courses</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg p-1">
              {(['line', 'bar', 'area', 'pie'] as const).map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
