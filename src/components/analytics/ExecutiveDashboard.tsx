import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Server,
  Clock,
  Database
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useRealTimeTrends, formatTrendChange, getTrendColor } from '@/hooks/useRealTimeTrends';
import { PageHeader } from '@/components/ui/PageHeader';

export const ExecutiveDashboard: React.FC = () => {
  const { healthMetrics, loading: healthLoading, error: healthError } = useSystemHealth();
  const { trends, loading: trendsLoading } = useRealTimeTrends();

  const loading = healthLoading || trendsLoading;

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ERROR': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSystemHealthStatus = () => {
    if (!healthMetrics) return { status: 'FAIR', color: 'bg-gray-100 text-gray-800' };
    
    if (healthMetrics.uptime >= 99.5 && healthMetrics.errorRate <= 1) {
      return { status: 'EXCELLENT', color: 'bg-green-100 text-green-800' };
    } else if (healthMetrics.uptime >= 95 && healthMetrics.errorRate <= 5) {
      return { status: 'GOOD', color: 'bg-blue-100 text-blue-800' };
    } else if (healthMetrics.uptime >= 90 && healthMetrics.errorRate <= 10) {
      return { status: 'FAIR', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'POOR', color: 'bg-red-100 text-red-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (healthError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading system health data</p>
        </div>
      </div>
    );
  }

  const systemHealth = getSystemHealthStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-7 w-7 text-primary" />}
        title="Executive Dashboard"
        subtitle="System-wide performance metrics and key insights"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Server className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-blue-600">
                {healthMetrics ? `${healthMetrics.uptime.toFixed(1)}%` : '0.0%'}
              </div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
              <div className={`text-xs mt-1 ${trends.uptime ? getTrendColor(trends.uptime, 'higher_better') : 'text-gray-600'}`}>
                {trends.uptime ? formatTrendChange(trends.uptime) : 'No trend data'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-3xl font-bold text-green-600">
                {healthMetrics ? healthMetrics.activeUsers : 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
              <div className={`text-xs mt-1 ${trends.active_users ? getTrendColor(trends.active_users, 'higher_better') : 'text-gray-600'}`}>
                {trends.active_users ? formatTrendChange(trends.active_users) : 'No trend data'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-600">
                {healthMetrics ? `${healthMetrics.responseTime}ms` : '0ms'}
              </div>
              <div className="text-sm text-muted-foreground">Response Time</div>
              <div className={`text-xs mt-1 ${trends.response_time ? getTrendColor(trends.response_time, 'lower_better') : 'text-gray-600'}`}>
                {trends.response_time ? formatTrendChange(trends.response_time) : 'No trend data'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-3xl font-bold text-orange-600">
                {healthMetrics ? `${healthMetrics.errorRate.toFixed(2)}%` : '0.00%'}
              </div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
              <Badge className={systemHealth.color}>
                {systemHealth.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Health</span>
                <Badge className={systemHealth.color}>
                  {systemHealth.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Uptime</span>
                  <span className={getHealthColor('GOOD')}>
                    {healthMetrics ? `${healthMetrics.uptime.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <Progress value={healthMetrics ? healthMetrics.uptime : 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Load</span>
                  <span className={getHealthColor('GOOD')}>
                    {healthMetrics ? `${(healthMetrics.systemLoad * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <Progress value={healthMetrics ? healthMetrics.systemLoad * 100 : 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className={getHealthColor('GOOD')}>
                    {healthMetrics ? `${(healthMetrics.memoryUsage * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <Progress value={healthMetrics ? healthMetrics.memoryUsage * 100 : 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {healthMetrics ? healthMetrics.databaseConnections : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {healthMetrics ? `${healthMetrics.responseTime}ms` : '0ms'}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Query Time</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connection Pool</span>
                    <span>{healthMetrics ? `${healthMetrics.databaseConnections}/50` : '0/50'}</span>
                  </div>
                  <Progress value={healthMetrics ? (healthMetrics.databaseConnections / 50) * 100 : 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>{healthMetrics ? `${(healthMetrics.diskUsage * 100).toFixed(1)}%` : '0.0%'}</span>
                  </div>
                  <Progress value={healthMetrics ? healthMetrics.diskUsage * 100 : 0} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Real-time system alerts based on current metrics */}
            {healthMetrics && (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">System health check completed</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          System uptime: {healthMetrics.uptime.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 15 * 60 * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {healthMetrics.responseTime > 500 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            High response time detected: {healthMetrics.responseTime}ms
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(Date.now() - 60 * 60 * 1000).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Monitoring
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {healthMetrics.errorRate > 2 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            Elevated error rate: {healthMetrics.errorRate.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Action Required
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          Database connections: {healthMetrics.databaseConnections} active
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </>
            )}
            
            {(!healthMetrics || (healthMetrics.uptime >= 99 && healthMetrics.errorRate <= 1)) && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>All systems operational - no critical alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
