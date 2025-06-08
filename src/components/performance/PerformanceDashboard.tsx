
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Database, Zap, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { PerformanceMonitor } from '@/services/performance/performanceMonitor';
import { CacheService } from '@/services/performance/cacheService';

export const PerformanceDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['performance-metrics', timeRange],
    queryFn: () => PerformanceMonitor.getMetrics(timeRange),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: cacheStats, isLoading: cacheLoading, refetch: refetchCache } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: () => CacheService.getStats(),
    refetchInterval: 60000 // Refresh every minute
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchCache();
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const avgResponseTime = metrics?.reduce((sum, m) => sum + (m.avg_response_time || 0), 0) / (metrics?.length || 1) || 0;
  const p95ResponseTime = metrics?.[0]?.p95_response_time || 0;
  const totalRequests = metrics?.reduce((sum, m) => sum + (m.total_requests || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system performance monitoring and optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: '1h' | '24h' | '7d') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(avgResponseTime, { good: 200, warning: 500 })}`} />
              <Badge variant={avgResponseTime <= 200 ? 'default' : avgResponseTime <= 500 ? 'secondary' : 'destructive'}>
                {avgResponseTime <= 200 ? 'Excellent' : avgResponseTime <= 500 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P95 Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{p95ResponseTime.toFixed(0)}ms</div>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(p95ResponseTime, { good: 500, warning: 1000 })}`} />
              <Badge variant={p95ResponseTime <= 500 ? 'default' : p95ResponseTime <= 1000 ? 'secondary' : 'destructive'}>
                {p95ResponseTime <= 500 ? 'Excellent' : p95ResponseTime <= 1000 ? 'Good' : 'Slow'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              in the last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cacheStats?.database?.[0] ? 
                Math.round((cacheStats.database[0].total_accesses / (cacheStats.database[0].total_entries || 1)) * 100) 
                : 0}%
            </div>
            <div className="flex items-center mt-1">
              <Zap className="h-3 w-3 mr-1 text-blue-500" />
              <span className="text-xs text-muted-foreground">
                {cacheStats?.memory?.entries || 0} in memory
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour_bucket" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Response Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_response_time" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Average"
                />
                <Line 
                  type="monotone" 
                  dataKey="p95_response_time" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="95th Percentile"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour_bucket" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis label={{ value: 'Requests', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                />
                <Bar dataKey="total_requests" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cacheStats?.database?.map((cache: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{cache.cache_namespace}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-medium">{cache.total_entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Entries:</span>
                    <span className="font-medium text-green-600">{cache.active_entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Accesses:</span>
                    <span className="font-medium">{cache.total_accesses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Access Count:</span>
                    <span className="font-medium">{cache.avg_access_count?.toFixed(1) || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {cacheStats?.memory && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Memory Cache</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Entries:</span>
                    <span className="font-medium">{cacheStats.memory.entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Size:</span>
                    <span className="font-medium">{cacheStats.memory.maxSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className="font-medium">
                      {Math.round((cacheStats.memory.entries / cacheStats.memory.maxSize) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
