
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface ComplianceAnalyticsData {
  metric_name: string;
  basic_completion_rate: number;
  robust_completion_rate: number;
  total_users_basic: number;
  total_users_robust: number;
  completed_basic: number;
  completed_robust: number;
}

interface TierDistributionData {
  tier_name: string;
  user_count: number;
  completion_percentage: number;
}

export function RealComplianceAnalytics() {
  const { data: analyticsData = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['compliance-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_compliance_analytics');
      if (error) throw error;
      return data as ComplianceAnalyticsData[];
    }
  });

  const { data: distributionData = [], isLoading: distributionLoading } = useQuery({
    queryKey: ['tier-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tier_distribution');
      if (error) throw error;
      return data as TierDistributionData[];
    }
  });

  const isLoading = analyticsLoading || distributionLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for charts
  const pieChartData = distributionData.map(item => ({
    name: item.tier_name.charAt(0).toUpperCase() + item.tier_name.slice(1),
    value: Number(item.user_count)
  }));

  const radarChartData = analyticsData.map(item => ({
    metric: item.metric_name.substring(0, 12) + (item.metric_name.length > 12 ? '...' : ''),
    basic: Math.round(Number(item.basic_completion_rate)),
    robust: Math.round(Number(item.robust_completion_rate))
  }));

  const barChartData = analyticsData.map(item => ({
    name: item.metric_name.substring(0, 15) + (item.metric_name.length > 15 ? '...' : ''),
    'Basic Tier': Math.round(Number(item.basic_completion_rate)),
    'Robust Tier': Math.round(Number(item.robust_completion_rate))
  }));

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Compliance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="h-80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div>
                <h3 className="text-lg font-medium mb-4">User Distribution by Tier</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} users`, 'Count']} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Completion Rates by Tier</h3>
                <div className="space-y-4">
                  {distributionData.map((tier, index) => (
                    <div key={tier.tier_name} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{tier.tier_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{tier.user_count} users</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(Number(tier.completion_percentage))}% complete
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
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
                <Tooltip formatter={(value: number) => [`${value}%`, 'Completion Rate']} />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="performance" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']} 
                />
                <Legend />
                <Bar name="Basic Tier" dataKey="Basic Tier" fill="#3B82F6" />
                <Bar name="Robust Tier" dataKey="Robust Tier" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="completion" className="h-80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Tier Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.map((item) => (
                      <div key={`basic-${item.metric_name}`} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.metric_name.length > 20 
                            ? item.metric_name.substring(0, 20) + '...' 
                            : item.metric_name
                          }
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(Number(item.basic_completion_rate), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">
                            {Math.round(Number(item.basic_completion_rate))}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Robust Tier Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.map((item) => (
                      <div key={`robust-${item.metric_name}`} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.metric_name.length > 20 
                            ? item.metric_name.substring(0, 20) + '...' 
                            : item.metric_name
                          }
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(Number(item.robust_completion_rate), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">
                            {Math.round(Number(item.robust_completion_rate))}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
