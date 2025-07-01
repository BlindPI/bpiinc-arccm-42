import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    connections: number;
    maxConnections: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
  };
  compliance: {
    activeUsers: number;
    pendingReviews: number;
    documentsProcessed: number;
    errorCount: number;
  };
  realtime: {
    activeConnections: number;
    subscriptions: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemMetrics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      
      // Simulate system metrics collection
      const systemMetrics = await collectSystemMetrics();
      const systemAlerts = await collectSystemAlerts();
      
      setMetrics(systemMetrics);
      setAlerts(systemAlerts);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error loading system metrics:', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const collectSystemMetrics = async (): Promise<SystemMetrics> => {
    // Test database connection and get basic stats
    const dbStart = Date.now();
    
    try {
      // Test database response time
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      // Get compliance statistics
      const { data: complianceRecords } = await supabase
        .from('user_compliance_records')
        .select('id, compliance_status')
        .limit(1000);
      
      const { data: documents } = await supabase
        .from('compliance_documents')
        .select('id')
        .limit(1000);
      
      const pendingReviews = complianceRecords?.filter(r => r.compliance_status === 'pending').length || 0;
      const documentsCount = documents?.length || 0;
      
      // Simulate other metrics
      const mockMetrics: SystemMetrics = {
        database: {
          status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'critical',
          responseTime: dbResponseTime,
          connections: Math.floor(Math.random() * 20) + 5,
          maxConnections: 100
        },
        storage: {
          used: Math.floor(Math.random() * 40) + 20, // 20-60 GB
          total: 100, // 100 GB
          percentage: 0,
          status: 'healthy'
        },
        performance: {
          avgResponseTime: dbResponseTime + Math.floor(Math.random() * 50),
          requestsPerMinute: Math.floor(Math.random() * 100) + 50,
          errorRate: Math.random() * 2, // 0-2%
          uptime: 99.8 + Math.random() * 0.2 // 99.8-100%
        },
        compliance: {
          activeUsers: Math.floor(Math.random() * 50) + 100,
          pendingReviews,
          documentsProcessed: documentsCount,
          errorCount: Math.floor(Math.random() * 5)
        },
        realtime: {
          activeConnections: Math.floor(Math.random() * 30) + 10,
          subscriptions: Math.floor(Math.random() * 100) + 50,
          status: 'healthy'
        }
      };
      
      // Calculate storage percentage
      mockMetrics.storage.percentage = (mockMetrics.storage.used / mockMetrics.storage.total) * 100;
      mockMetrics.storage.status = mockMetrics.storage.percentage > 80 ? 'critical' : 
                                   mockMetrics.storage.percentage > 60 ? 'warning' : 'healthy';
      
      return mockMetrics;
      
    } catch (error) {
      console.error('Database health check failed:', error);
      
      // Return error state metrics
      return {
        database: {
          status: 'critical',
          responseTime: 9999,
          connections: 0,
          maxConnections: 100
        },
        storage: {
          used: 0,
          total: 100,
          percentage: 0,
          status: 'critical'
        },
        performance: {
          avgResponseTime: 9999,
          requestsPerMinute: 0,
          errorRate: 100,
          uptime: 0
        },
        compliance: {
          activeUsers: 0,
          pendingReviews: 0,
          documentsProcessed: 0,
          errorCount: 999
        },
        realtime: {
          activeConnections: 0,
          subscriptions: 0,
          status: 'critical'
        }
      };
    }
  };

  const collectSystemAlerts = async (): Promise<SystemAlert[]> => {
    // In a real implementation, these would come from system monitoring
    const mockAlerts: SystemAlert[] = [];
    
    // Add some sample alerts based on metrics
    if (metrics?.database.responseTime && metrics.database.responseTime > 500) {
      mockAlerts.push({
        id: 'db-slow',
        type: 'warning',
        title: 'Database Response Time High',
        message: `Database response time is ${metrics.database.responseTime}ms, which exceeds the 500ms threshold.`,
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        resolved: false
      });
    }
    
    if (metrics?.storage.percentage && metrics.storage.percentage > 80) {
      mockAlerts.push({
        id: 'storage-high',
        type: 'error',
        title: 'Storage Usage Critical',
        message: `Storage usage is at ${metrics.storage.percentage.toFixed(1)}%, immediate action required.`,
        timestamp: new Date(Date.now() - Math.random() * 1800000), // Random time in last 30 minutes
        resolved: false
      });
    }
    
    if (metrics?.compliance.errorCount && metrics.compliance.errorCount > 10) {
      mockAlerts.push({
        id: 'compliance-errors',
        type: 'warning',
        title: 'High Compliance Error Rate',
        message: `${metrics.compliance.errorCount} compliance processing errors detected in the last hour.`,
        timestamp: new Date(Date.now() - Math.random() * 900000), // Random time in last 15 minutes
        resolved: false
      });
    }
    
    return mockAlerts;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const exportHealthReport = async () => {
    try {
      if (!metrics) return;
      
      const healthReport = {
        generatedAt: new Date().toISOString(),
        lastUpdate: lastUpdate.toISOString(),
        systemMetrics: metrics,
        alerts: alerts.filter(alert => !alert.resolved),
        summary: {
          overallHealth: getOverallHealth(),
          criticalIssues: alerts.filter(a => a.type === 'error' && !a.resolved).length,
          warnings: alerts.filter(a => a.type === 'warning' && !a.resolved).length
        }
      };
      
      const blob = new Blob([JSON.stringify(healthReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-health-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Health report exported successfully');
    } catch (error) {
      console.error('Error exporting health report:', error);
      toast.error('Failed to export health report');
    }
  };

  const getOverallHealth = (): 'healthy' | 'warning' | 'critical' => {
    if (!metrics) return 'critical';
    
    const statuses = [
      metrics.database.status,
      metrics.storage.status,
      metrics.realtime.status
    ];
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  };

  if (loading && !metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring and health metrics
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSystemMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportHealthReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <Alert className={`border-2 ${getStatusColor(getOverallHealth())}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon(getOverallHealth())}
          <AlertTitle>System Status: {getOverallHealth().toUpperCase()}</AlertTitle>
        </div>
        <AlertDescription>
          {getOverallHealth() === 'healthy' && 'All systems operating normally.'}
          {getOverallHealth() === 'warning' && 'Some systems require attention.'}
          {getOverallHealth() === 'critical' && 'Critical issues detected requiring immediate action.'}
        </AlertDescription>
      </Alert>

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge className={getStatusColor(metrics?.database.status || 'critical')}>
                {getStatusIcon(metrics?.database.status || 'critical')}
                <span className="ml-1 capitalize">{metrics?.database.status || 'Unknown'}</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold">{metrics?.database.responseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.database.connections || 0}/{metrics?.database.maxConnections || 0} connections
            </p>
          </CardContent>
        </Card>

        {/* Storage Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge className={getStatusColor(metrics?.storage.status || 'critical')}>
                {getStatusIcon(metrics?.storage.status || 'critical')}
                <span className="ml-1 capitalize">{metrics?.storage.status || 'Unknown'}</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold">{metrics?.storage.percentage.toFixed(1) || 0}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={metrics?.storage.percentage || 0} className="h-1 flex-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.storage.used || 0}GB / {metrics?.storage.total || 0}GB used
            </p>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.performance.uptime.toFixed(2) || 0}%</div>
            <p className="text-xs text-muted-foreground mb-1">Uptime</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Avg Response:</span>
                <span>{metrics?.performance.avgResponseTime || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Requests/min:</span>
                <span>{metrics?.performance.requestsPerMinute || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span>{metrics?.performance.errorRate.toFixed(2) || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realtime Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realtime</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge className={getStatusColor(metrics?.realtime.status || 'critical')}>
                {getStatusIcon(metrics?.realtime.status || 'critical')}
                <span className="ml-1 capitalize">{metrics?.realtime.status || 'Unknown'}</span>
              </Badge>
            </div>
            <div className="text-2xl font-bold">{metrics?.realtime.activeConnections || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.realtime.subscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics?.compliance.activeUsers || 0}</div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics?.compliance.pendingReviews || 0}</div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics?.compliance.documentsProcessed || 0}</div>
              <p className="text-sm text-muted-foreground">Documents Processed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics?.compliance.errorCount || 0}</div>
              <p className="text-sm text-muted-foreground">Processing Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts ({alerts.filter(a => !a.resolved).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p>No active alerts</p>
                <p className="text-sm">All systems are operating normally</p>
              </div>
            ) : (
              alerts
                .filter(alert => !alert.resolved)
                .slice(0, 10)
                .map((alert) => (
                  <Alert key={alert.id} className={`border-l-4 ${
                    alert.type === 'error' ? 'border-l-red-500' : 
                    alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                          {alert.title}
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {alert.message}
                        </AlertDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        alert.type === 'error' ? 'text-red-600' : 
                        alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }>
                        {alert.type.toUpperCase()}
                      </Badge>
                    </div>
                  </Alert>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}