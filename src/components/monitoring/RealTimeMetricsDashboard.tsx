import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  Play, 
  Pause, 
  RefreshCw,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { realTimeMetricsService } from '@/services/monitoring';
import type { RealTimeMetric, MetricAggregation } from '@/services/monitoring';

interface MetricDisplayProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({
  title,
  value,
  unit,
  change,
  icon,
  color = 'blue'
}) => {
  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? '↗' : '↘';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`text-${color}-600`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        {change !== undefined && (
          <p className={`text-xs ${getChangeColor(change)} flex items-center mt-1`}>
            <span className="mr-1">{getChangeIcon(change)}</span>
            {Math.abs(change).toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const RealTimeMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [aggregations, setAggregations] = useState<MetricAggregation[]>([]);
  const [liveDashboard, setLiveDashboard] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('activity_count');
  const [selectedPeriod, setSelectedPeriod] = useState<'minute' | 'hour' | 'day'>('hour');
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const [recentMetrics, metricAggregations, dashboard] = await Promise.all([
        realTimeMetricsService.getRecentMetrics(selectedMetric, undefined, 100),
        realTimeMetricsService.getMetricAggregations(
          selectedMetric,
          selectedPeriod,
          'avg',
          {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        ),
        realTimeMetricsService.getLiveDashboardMetrics()
      ]);

      setMetrics(recentMetrics);
      setAggregations(metricAggregations);
      setLiveDashboard(dashboard);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMetric, selectedPeriod]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isLive, fetchMetrics]);

  const toggleLiveMode = () => {
    setIsLive(!isLive);
  };

  const formatChartData = (aggregations: MetricAggregation[]) => {
    return aggregations.map(agg => ({
      timestamp: new Date(agg.timestamp).toLocaleTimeString(),
      value: agg.value,
      fullTimestamp: agg.timestamp
    }));
  };

  const getMetricOptions = () => [
    { value: 'activity_count', label: 'Activity Count' },
    { value: 'response_time', label: 'Response Time' },
    { value: 'error_rate', label: 'Error Rate' },
    { value: 'uptime', label: 'Uptime' },
    { value: 'active_users', label: 'Active Users' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = formatChartData(aggregations);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Real-Time Metrics</h2>
          <p className="text-muted-foreground">
            Live monitoring and analytics of system performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={isLive ? 'default' : 'secondary'} className="text-sm">
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </>
            ) : (
              'Paused'
            )}
          </Badge>
          <Button onClick={toggleLiveMode} variant="outline" size="sm">
            {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Dashboard Summary */}
      {liveDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricDisplay
            title="Total Activity"
            value={liveDashboard.summary.totalActivity}
            icon={<Activity className="h-4 w-4" />}
            color="blue"
          />
          <MetricDisplay
            title="Avg Response Time"
            value={liveDashboard.summary.avgResponseTime}
            unit="ms"
            icon={<Clock className="h-4 w-4" />}
            color="green"
          />
          <MetricDisplay
            title="Error Rate"
            value={liveDashboard.summary.errorRate.toFixed(2)}
            unit="%"
            icon={<TrendingUp className="h-4 w-4" />}
            color="red"
          />
          <MetricDisplay
            title="Active Users"
            value={liveDashboard.summary.activeUsers}
            icon={<Users className="h-4 w-4" />}
            color="purple"
          />
        </div>
      )}

      {/* Metric Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Metric:</label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMetricOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Period:</label>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">Minute</SelectItem>
              <SelectItem value="hour">Hour</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="line" className="space-y-4">
        <TabsList>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="area">Area Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="line" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {getMetricOptions().find(opt => opt.value === selectedMetric)?.label} Over Time
              </CardTitle>
              <CardDescription>
                Real-time metric visualization with {selectedPeriod}ly aggregation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return new Date(payload[0].payload.fullTimestamp).toLocaleString();
                        }
                        return label;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Area Chart View</CardTitle>
              <CardDescription>
                Filled area representation of metric trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bar Chart View</CardTitle>
              <CardDescription>
                Discrete value representation by time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {liveDashboard && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Hourly Activity
                    </CardTitle>
                    <CardDescription>Activity trends over the last hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={liveDashboard.hourlyActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Daily Trends
                    </CardTitle>
                    <CardDescription>Activity trends over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={liveDashboard.dailyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#f59e0b" 
                            fill="#f59e0b" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Recent Metrics
          </CardTitle>
          <CardDescription>
            Latest {selectedMetric} measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Unit</th>
                  <th className="text-left p-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map((metric) => (
                  <tr key={metric.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {new Date(metric.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2 font-mono">{metric.metric_value}</td>
                    <td className="p-2">{metric.metric_unit}</td>
                    <td className="p-2">
                      <Badge variant="outline">{metric.category}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-sm text-muted-foreground text-center">
        {isLive ? 'Auto-refreshing every 5 seconds' : 'Live updates paused'} • 
        Showing data for {getMetricOptions().find(opt => opt.value === selectedMetric)?.label}
      </div>
    </div>
  );
};

export default RealTimeMetricsDashboard;