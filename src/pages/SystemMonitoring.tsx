import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Activity, 
  AlertTriangle, 
  FileText, 
  BarChart3,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import SystemHealthDashboard from '@/components/monitoring/SystemHealthDashboard';
import RealTimeMetricsDashboard from '@/components/monitoring/RealTimeMetricsDashboard';
import AlertManagementDashboard from '@/components/monitoring/AlertManagementDashboard';
import ReportGenerationDashboard from '@/components/monitoring/ReportGenerationDashboard';
import { useSystemHealth } from '@/hooks/useSystemHealth';

const SystemMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { healthMetrics, loading } = useSystemHealth();

  const getSystemStatus = () => {
    if (!healthMetrics) return { status: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    
    if (healthMetrics.uptime >= 99.5 && healthMetrics.errorRate <= 1) {
      return { status: 'Healthy', color: 'bg-green-100 text-green-800' };
    } else if (healthMetrics.uptime >= 95 && healthMetrics.errorRate <= 5) {
      return { status: 'Warning', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'Critical', color: 'bg-red-100 text-red-800' };
    }
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Monitor className="h-7 w-7 text-primary" />}
        title="System Monitoring"
        subtitle="Comprehensive monitoring and analytics dashboard"
        actions={
          <Badge className={systemStatus.color}>
            <Shield className="h-3 w-3 mr-1" />
            {systemStatus.status}
          </Badge>
        }
      />

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">
                  {loading ? 'Loading...' : `${healthMetrics?.uptime.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">
                  {loading ? 'Loading...' : `${healthMetrics?.responseTime}ms`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">
                  {loading ? 'Loading...' : `${healthMetrics?.errorRate.toFixed(2)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">DB Connections</p>
                <p className="text-2xl font-bold">
                  {loading ? 'Loading...' : healthMetrics?.databaseConnections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Metrics
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Overview
              </CardTitle>
              <CardDescription>
                Comprehensive view of system health, performance metrics, and operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemHealthDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Performance Metrics
              </CardTitle>
              <CardDescription>
                Live monitoring of system performance with real-time charts and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeMetricsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Management
              </CardTitle>
              <CardDescription>
                Monitor, acknowledge, and manage system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertManagementDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Generation
              </CardTitle>
              <CardDescription>
                Generate, schedule, and export system performance and monitoring reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportGenerationDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Information Footer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Last Updated</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Monitoring Status</p>
              <p className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Data Retention</p>
              <p>30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoring;
