import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert as UIAlert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Server, 
  Users, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { systemHealthService, alertManagementService } from '@/services/monitoring';
import type { SystemHealthMetrics, Alert as SystemAlert } from '@/services/monitoring';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  status,
  icon,
  trend,
  description
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <Card className={`${getStatusColor(status)} border-2`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {getTrendIcon(trend)}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SystemHealthDashboard: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      const [metrics, systemAlerts] = await Promise.all([
        systemHealthService.getSystemHealth(),
        alertManagementService.getAlerts({ status: 'active' }, 10)
      ]);
      
      setHealthMetrics(metrics);
      setAlerts(systemAlerts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = (metrics: SystemHealthMetrics) => {
    if (metrics.uptime < 95 || metrics.errorRate > 5) return 'critical';
    if (metrics.uptime < 99 || metrics.errorRate > 2 || metrics.responseTime > 500) return 'warning';
    return 'good';
  };

  const getUptimeStatus = (uptime: number) => {
    if (uptime >= 99.5) return 'good';
    if (uptime >= 95) return 'warning';
    return 'critical';
  };

  const getResponseTimeStatus = (responseTime: number) => {
    if (responseTime <= 200) return 'good';
    if (responseTime <= 500) return 'warning';
    return 'critical';
  };

  const getErrorRateStatus = (errorRate: number) => {
    if (errorRate <= 1) return 'good';
    if (errorRate <= 5) return 'warning';
    return 'critical';
  };

  const getMemoryStatus = (usage: number) => {
    if (usage <= 0.7) return 'good';
    if (usage <= 0.85) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!healthMetrics) {
    return (
      <UIAlert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load system health metrics. Please try again later.
        </AlertDescription>
      </UIAlert>
    );
  }

  const overallStatus = getHealthStatus(healthMetrics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge 
            variant={overallStatus === 'good' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'}
            className="text-sm"
          >
            {overallStatus === 'good' ? 'Healthy' : overallStatus === 'warning' ? 'Warning' : 'Critical'}
          </Badge>
          <Button 
            onClick={fetchHealthData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthMetricCard
          title="System Uptime"
          value={healthMetrics.uptime.toFixed(1)}
          unit="%"
          status={getUptimeStatus(healthMetrics.uptime)}
          icon={<Server className="h-4 w-4" />}
          trend="stable"
          description="Last 24 hours"
        />
        
        <HealthMetricCard
          title="Response Time"
          value={healthMetrics.responseTime}
          unit="ms"
          status={getResponseTimeStatus(healthMetrics.responseTime)}
          icon={<Clock className="h-4 w-4" />}
          trend={healthMetrics.responseTime > 300 ? 'up' : 'stable'}
          description="Average response time"
        />
        
        <HealthMetricCard
          title="Error Rate"
          value={healthMetrics.errorRate.toFixed(2)}
          unit="%"
          status={getErrorRateStatus(healthMetrics.errorRate)}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={healthMetrics.errorRate > 2 ? 'up' : 'stable'}
          description="Last hour"
        />
        
        <HealthMetricCard
          title="Active Users"
          value={healthMetrics.activeUsers}
          status="good"
          icon={<Users className="h-4 w-4" />}
          trend="stable"
          description="Last 15 minutes"
        />
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  System Load
                </CardTitle>
                <CardDescription>Current system load percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Load</span>
                    <span>{(healthMetrics.systemLoad * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={healthMetrics.systemLoad * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Connections
                </CardTitle>
                <CardDescription>Active database connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthMetrics.databaseConnections}</div>
                <p className="text-sm text-muted-foreground">connections</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MemoryStick className="h-5 w-5 mr-2" />
                  Memory Usage
                </CardTitle>
                <CardDescription>Current memory utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Used</span>
                    <span>{(healthMetrics.memoryUsage * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={healthMetrics.memoryUsage * 100} 
                    className={`w-full ${getMemoryStatus(healthMetrics.memoryUsage) === 'critical' ? 'bg-red-100' : ''}`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Disk Usage
                </CardTitle>
                <CardDescription>Current disk space utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Used</span>
                    <span>{(healthMetrics.diskUsage * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={healthMetrics.diskUsage * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Current system alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mr-2 text-green-500" />
                  No active alerts
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <UIAlert key={alert.id} className={
                      alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                      alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>{alert.message}</strong>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'destructive' :
                            alert.severity === 'medium' ? 'secondary' :
                            'default'
                          }>
                            {alert.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </UIAlert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-sm text-muted-foreground text-center">
        Last updated: {lastUpdated.toLocaleString()} • Auto-refresh every 30 seconds
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
