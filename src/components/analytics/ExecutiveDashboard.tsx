
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
  BarChart3
} from 'lucide-react';
import { useReportingAnalytics } from '@/hooks/useReportingAnalytics';
import { PageHeader } from '@/components/ui/PageHeader';

export const ExecutiveDashboard: React.FC = () => {
  const { useExecutiveDashboard } = useReportingAnalytics();
  const { data: metrics, isLoading } = useExecutiveDashboard();

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
        icon={<BarChart3 className="h-7 w-7 text-primary" />}
        title="Executive Dashboard"
        subtitle="System-wide performance metrics and key insights"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-blue-600">{metrics?.totalUsers || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-xs text-green-600 mt-1">
                +{metrics?.monthlyGrowth || 0}% this month
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-3xl font-bold text-green-600">{metrics?.activeInstructors || 0}</div>
              <div className="text-sm text-muted-foreground">Active Instructors</div>
              <div className="text-xs text-blue-600 mt-1">
                {((metrics?.utilizationRate || 0)).toFixed(1)}% utilized
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-600">{metrics?.totalCertificates || 0}</div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
              <div className="text-xs text-green-600 mt-1">
                Active certificates
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-3xl font-bold text-orange-600">
                {(metrics?.complianceRate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
              <Badge className={getHealthBadge(metrics?.systemHealth || 'FAIR')}>
                {metrics?.systemHealth || 'FAIR'}
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
                <Badge className={getHealthBadge(metrics?.systemHealth || 'FAIR')}>
                  {metrics?.systemHealth || 'FAIR'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance Rate</span>
                  <span className={getHealthColor('GOOD')}>
                    {(metrics?.complianceRate || 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics?.complianceRate || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Instructor Utilization</span>
                  <span className={getHealthColor('GOOD')}>
                    {(metrics?.utilizationRate || 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics?.utilizationRate || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Uptime</span>
                  <span className="text-green-600">99.9%</span>
                </div>
                <Progress value={99.9} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Instructors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topPerformers?.slice(0, 5).map((performer, index) => (
                <div key={performer.instructorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{performer.instructorName}</div>
                      <div className="text-sm text-muted-foreground">{performer.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {performer.complianceScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {performer.totalSessions} sessions
                    </div>
                  </div>
                </div>
              ))}
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
            {metrics?.alerts?.map((alert) => (
              <Alert key={alert.id}>
                {getAlertIcon(alert.type)}
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Badge variant="outline" className="ml-2">
                        Action Required
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            
            {(!metrics?.alerts || metrics.alerts.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>All systems operational - no alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
