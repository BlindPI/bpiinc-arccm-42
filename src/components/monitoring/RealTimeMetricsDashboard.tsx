
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, TrendingUp, Clock, Users, Database, Zap } from 'lucide-react';
import { realTimeMetricsService } from '@/services/monitoring';
import type { RealTimeMetric } from '@/services/monitoring';

const RealTimeMetricsDashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string>('response_time');
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('hour');
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const metricOptions = [
    { value: 'response_time', label: 'Response Time', icon: Clock, unit: 'ms' },
    { value: 'active_users', label: 'Active Users', icon: Users, unit: 'users' },
    { value: 'system_load', label: 'System Load', icon: Zap, unit: '%' },
    { value: 'db_connections', label: 'DB Connections', icon: Database, unit: 'connections' },
    { value: 'uptime', label: 'Uptime', icon: TrendingUp, unit: '%' },
    { value: 'error_rate', label: 'Error Rate', icon: Activity, unit: '%' }
  ];

  const currentMetricOption = metricOptions.find(opt => opt.value === selectedMetric);

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time subscription
    const unsubscribe = realTimeMetricsService.subscribeToMetrics(selectedMetric, (newMetric) => {
      setMetrics(prev => [newMetric, ...prev.slice(0, 49)]); // Keep last 50 points
    });

    return unsubscribe;
  }, [selectedMetric, timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await realTimeMetricsService.getMetricHistory(selectedMetric, timeRange, 100);
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = metrics.map(metric => ({
    time: new Date(metric.recorded_at).toLocaleTimeString(),
    value: metric.metric_value,
    timestamp: metric.recorded_at
  })).reverse();

  const latestValue = metrics[0]?.metric_value || 0;
  const previousValue = metrics[1]?.metric_value || 0;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable';
  const changePercent = previousValue > 0 ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value: 'hour' | 'day' | 'week') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">1 Hour</SelectItem>
              <SelectItem value="day">1 Day</SelectItem>
              <SelectItem value="week">1 Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Value Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            {currentMetricOption && <currentMetricOption.icon className="h-5 w-5" />}
            {currentMetricOption?.label || 'Metric'}
          </CardTitle>
          <CardDescription>Real-time monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {latestValue.toFixed(currentMetricOption?.value === 'response_time' ? 0 : 2)}
                <span className="text-sm font-normal ml-1 text-muted-foreground">
                  {currentMetricOption?.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={trend === 'up' ? 'destructive' : trend === 'down' ? 'default' : 'secondary'}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {changePercent}%
                </Badge>
                <span className="text-sm text-muted-foreground">vs previous reading</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Chart</CardTitle>
          <CardDescription>
            {currentMetricOption?.label} over the last {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: number) => [
                    `${value.toFixed(2)} ${currentMetricOption?.unit}`,
                    currentMetricOption?.label
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Live Status */}
      <Card>
        <CardHeader>
          <CardTitle>Live Status</CardTitle>
          <CardDescription>Real-time system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Live monitoring active</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Last update: {metrics[0] ? new Date(metrics[0].recorded_at).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetricsDashboard;
