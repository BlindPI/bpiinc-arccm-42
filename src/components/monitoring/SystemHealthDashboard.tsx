
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
  const [healthMetrics, setHealthMetrics] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      const [metrics, systemAlerts] = await Promise.all([
        systemHealthService.getSystemHealth(),
        alertManagementService.getSystemAlerts('OPEN')
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

  const getHealthStatus = (metrics: any) => {
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthMetricCard
          title="System Uptime"
          value={healthMetrics.uptime || 99.9}
          unit="%"
          status={getUptimeStatus(healthMetrics.uptime || 99.9)}
          icon={<Server className="h-4 w-4" />}
          trend="stable"
          description="Last 24 hours"
        />
        
        <HealthMetricCard
          title="Response Time"
          value={healthMetrics.responseTime || 150}
          unit="ms"
          status={getResponseTimeStatus(healthMetrics.responseTime || 150)}
          icon={<Zap className="h-4 w-4" />}
          trend="stable"
          description="Average response time"
        />
        
        <HealthMetricCard
          title="Error Rate"
          value={healthMetrics.errorRate || 0.5}
          unit="%"
          status={getErrorRateStatus(healthMetrics.errorRate || 0.5)}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend="down"
          description="Last hour"
        />
        
        <HealthMetricCard
          title="Memory Usage"
          value={Math.round((healthMetrics.memoryUsage || 0.65) * 100)}
          unit="%"
          status={getMemoryStatus(healthMetrics.memoryUsage || 0.65)}
          icon={<MemoryStick className="h-4 w-4" />}
          trend="up"
          description="System memory"
        />
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active System Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div>
                    <h4 className="font-medium">{alert.message}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
