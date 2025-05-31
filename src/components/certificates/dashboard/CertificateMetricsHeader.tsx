
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Settings,
  Activity
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface CertificateMetricsHeaderProps {
  canManageRequests: boolean;
  metrics?: {
    totalCertificates: number;
    pendingRequests: number;
    completionRate: number;
    recentActivity: number;
  };
}

export const CertificateMetricsHeader: React.FC<CertificateMetricsHeaderProps> = ({
  canManageRequests,
  metrics = {
    totalCertificates: 0,
    pendingRequests: 0,
    completionRate: 0,
    recentActivity: 0
  }
}) => {
  const metricCards: MetricCard[] = [
    {
      title: 'Total Certificates',
      value: metrics.totalCertificates.toLocaleString(),
      trend: {
        value: 12,
        direction: 'up',
        period: 'vs last month'
      },
      icon: Award,
      color: 'blue',
      description: 'Issued certificates'
    },
    {
      title: 'Pending Requests',
      value: metrics.pendingRequests,
      trend: {
        value: metrics.pendingRequests > 10 ? 8 : 2,
        direction: metrics.pendingRequests > 10 ? 'up' : 'down',
        period: 'vs last week'
      },
      icon: Clock,
      color: metrics.pendingRequests > 10 ? 'red' : 'amber',
      description: 'Awaiting approval'
    },
    {
      title: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      trend: {
        value: 5,
        direction: 'up',
        period: 'vs last month'
      },
      icon: CheckCircle,
      color: 'green',
      description: 'Request approval rate'
    },
    {
      title: 'Recent Activity',
      value: metrics.recentActivity,
      trend: {
        value: 15,
        direction: 'up',
        period: 'vs yesterday'
      },
      icon: Activity,
      color: 'purple',
      description: 'Actions this week'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        trend: 'text-blue-600'
      },
      red: {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        trend: 'text-red-600'
      },
      amber: {
        icon: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        trend: 'text-amber-600'
      },
      green: {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        trend: 'text-green-600'
      },
      purple: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        trend: 'text-purple-600'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate Management
          </h1>
          <p className="text-gray-600 max-w-2xl">
            {canManageRequests 
              ? 'Comprehensive certificate management platform with advanced analytics, batch operations, and enterprise-level controls'
              : 'Track and manage your certification requests with detailed status insights and streamlined workflows'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManageRequests && (
            <Badge variant="default" className="bg-green-100 text-green-800 px-3 py-1">
              <Users className="h-3 w-3 mr-1" />
              Administrator Access
            </Badge>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            {canManageRequests && (
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const colors = getColorClasses(metric.color);
          
          return (
            <Card key={index} className={`border-2 ${colors.border} hover:shadow-lg transition-all duration-200`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <metric.icon className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {metric.description}
                    </p>
                    
                    {metric.trend && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend.direction)}
                        <span className={`text-xs font-medium ${colors.trend}`}>
                          {metric.trend.value}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {metric.trend && (
                    <p className="text-xs text-gray-400">
                      {metric.trend.period}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
