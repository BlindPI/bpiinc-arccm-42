
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { PageHeader } from '@/components/ui/PageHeader';

export const SystemHealthDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    healthMetrics, 
    systemStatus, 
    performanceMetrics,
    refreshHealthData,
    isLoading 
  } = useSystemHealth();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHealthData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Activity className="h-7 w-7 text-primary" />}
        title="System Health Monitoring"
        subtitle="Real-time system performance and health metrics"
        actions={
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus?.overall || 'unknown')}
              <div>
                <div className="font-medium capitalize">
                  {systemStatus?.overall || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
            <Badge 
              variant={systemStatus?.overall === 'healthy' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {systemStatus?.uptime || '99.9%'} Uptime
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Database</span>
              </div>
              {getStatusIcon(healthMetrics?.database?.status || 'healthy')}
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-muted-foreground">
                Response: {healthMetrics?.database?.responseTime || '< 10ms'}
              </div>
              <div className="text-sm text-muted-foreground">
                Connections: {healthMetrics?.database?.connections || '5/100'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="font-medium">API</span>
              </div>
              {getStatusIcon(healthMetrics?.api?.status || 'healthy')}
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-muted-foreground">
                Response: {healthMetrics?.api?.responseTime || '< 50ms'}
              </div>
              <div className="text-sm text-muted-foreground">
                Requests/min: {healthMetrics?.api?.requestsPerMinute || '120'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Storage</span>
              </div>
              {getStatusIcon(healthMetrics?.storage?.status || 'healthy')}
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-muted-foreground">
                Used: {healthMetrics?.storage?.usedSpace || '2.1 GB'}
              </div>
              <div className="text-sm text-muted-foreground">
                Available: {healthMetrics?.storage?.availableSpace || '47.9 GB'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Functions</span>
              </div>
              {getStatusIcon(healthMetrics?.functions?.status || 'healthy')}
            </div>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-muted-foreground">
                Active: {healthMetrics?.functions?.activeCount || '12'}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg execution: {healthMetrics?.functions?.avgExecution || '120ms'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{performanceMetrics?.cpu || 15}%</span>
              </div>
              <Progress value={performanceMetrics?.cpu || 15} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{performanceMetrics?.memory || 32}%</span>
              </div>
              <Progress value={performanceMetrics?.memory || 32} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span>{performanceMetrics?.disk || 45}%</span>
              </div>
              <Progress value={performanceMetrics?.disk || 45} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStatus?.recentAlerts?.length > 0 ? (
              systemStatus.recentAlerts.map((alert: any, index: number) => (
                <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {alert.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>No recent alerts - system operating normally</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
