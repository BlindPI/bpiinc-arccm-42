import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface ActivityMetrics {
  totalActivities: number;
  activeUsers: number;
  avgSessionDuration: number;
  topActivities: Array<{ type: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyTrends: Array<{ date: string; activities: number; users: number }>;
  teamEngagement: Array<{ teamId: string; teamName: string; activityCount: number }>;
}

interface ActivityAnalyticsDashboardProps {
  teamId?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ActivityAnalyticsDashboard({ teamId }: ActivityAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch activity analytics data
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['activity-analytics', teamId, timeRange, refreshTrigger],
    queryFn: async (): Promise<ActivityMetrics> => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Base query
      let activityQuery = supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          activity_type,
          activity_category,
          created_at,
          duration_seconds,
          metadata
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filter by team if specified
      if (teamId) {
        activityQuery = activityQuery.eq('metadata->>team_id', teamId);
      }

      const { data: activities = [], error } = await activityQuery;
      if (error) throw error;

      // Calculate metrics
      const totalActivities = activities.length;
      const uniqueUsers = new Set(activities.map(a => a.user_id)).size;
      const avgDuration = activities.reduce((acc, a) => acc + (a.duration_seconds || 0), 0) / activities.length || 0;

      // Top activities
      const activityCounts = activities.reduce((acc, a) => {
        acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActivities = Object.entries(activityCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Hourly distribution
      const hourlyData = activities.reduce((acc, a) => {
        const hour = new Date(a.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourlyData[hour] || 0
      }));

      // Daily trends
      const dailyData = activities.reduce((acc, a) => {
        const date = new Date(a.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { activities: 0, users: new Set() };
        }
        acc[date].activities++;
        acc[date].users.add(a.user_id);
        return acc;
      }, {} as Record<string, { activities: number; users: Set<string> }>);

      const dailyTrends = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          activities: data.activities,
          users: data.users.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Team engagement (if not filtering by specific team)
      let teamEngagement: Array<{ teamId: string; teamName: string; activityCount: number }> = [];
      if (!teamId) {
      const teamData = activities.reduce((acc, a) => {
        const metadata = a.metadata as any;
        const tId = metadata?.team_id;
        if (tId) {
          if (!acc[tId]) {
            acc[tId] = { count: 0, name: metadata?.team_name || `Team ${tId}` };
          }
          acc[tId].count++;
        }
        return acc;
      }, {} as Record<string, { count: number; name: string }>);

        teamEngagement = Object.entries(teamData)
          .map(([teamId, data]) => ({
            teamId,
            teamName: data.name,
            activityCount: data.count
          }))
          .sort((a, b) => b.activityCount - a.activityCount)
          .slice(0, 10);
      }

      return {
        totalActivities,
        activeUsers: uniqueUsers,
        avgSessionDuration: Math.round(avgDuration / 60), // Convert to minutes
        topActivities,
        hourlyDistribution,
        dailyTrends,
        teamEngagement
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  const handleExport = () => {
    if (!metrics) return;
    
    const data = {
      timeRange,
      generatedAt: new Date().toISOString(),
      metrics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-analytics-${timeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return <div>Failed to load analytics data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Activity Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Activities</p>
                <p className="text-2xl font-bold">{metrics.totalActivities.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Session</p>
                <p className="text-2xl font-bold">{metrics.avgSessionDuration}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.totalActivities > 0 ? Math.round((metrics.activeUsers / metrics.totalActivities) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Distribution</TabsTrigger>
          <TabsTrigger value="activities">Top Activities</TabsTrigger>
          {!teamId && <TabsTrigger value="teams">Team Engagement</TabsTrigger>}
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="activities" stroke="#3b82f6" name="Activities" />
                  <Line type="monotone" dataKey="users" stroke="#10b981" name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Top Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topActivities.map((activity, index) => (
                  <div key={activity.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{activity.type.replace('_', ' ')}</span>
                    </div>
                    <Badge>{activity.count} times</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {!teamId && (
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Team Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.teamEngagement.map((team, index) => (
                    <div key={team.teamId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{team.teamName}</span>
                      </div>
                      <Badge>{team.activityCount} activities</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}