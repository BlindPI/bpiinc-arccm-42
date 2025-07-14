import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Activity,
  Award,
  Clock
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'good' | 'warning' | 'critical';
  isLoading?: boolean;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, status, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="h-[120px]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'bg-emerald-50 text-emerald-600';
      case 'warning': return 'bg-yellow-50 text-yellow-600';
      case 'critical': return 'bg-red-50 text-red-600';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
                <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getStatusColor()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfessionalMetricsGridProps {
  metrics?: {
    activeCourses: number;
    totalSessions: number;
    activeInstructors: number;
    upcomingSchedules: number;
    activeLocations: number;
    complianceRate: number;
    totalMembers: number;
    averagePerformance: number;
  };
  isLoading?: boolean;
}

export function ProfessionalMetricsGrid({ metrics, isLoading }: ProfessionalMetricsGridProps) {
  const getComplianceStatus = (): 'good' | 'warning' | 'critical' => {
    return (metrics?.complianceRate || 0) >= 90 ? 'good' : 'warning';
  };

  const getPerformanceStatus = (): 'good' | 'warning' | 'critical' => {
    return (metrics?.averagePerformance || 0) >= 85 ? 'good' : 'warning';
  };

  const metricCards = [
    {
      title: 'Active Courses',
      value: metrics?.activeCourses || 0,
      subtitle: 'available training courses',
      icon: BookOpen,
      status: 'good' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Active Sessions',
      value: metrics?.totalSessions || 0,
      subtitle: 'training sessions this month',
      icon: Calendar,
      status: 'good' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Active Instructors',
      value: metrics?.activeInstructors || 0,
      subtitle: 'certified instructors',
      icon: Users,
      status: 'good' as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Upcoming Schedules',
      value: metrics?.upcomingSchedules || 0,
      subtitle: 'scheduled courses',
      icon: Calendar,
      status: 'warning' as const,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Active Locations',
      value: metrics?.activeLocations || 0,
      subtitle: 'training facilities',
      icon: MapPin,
      status: 'good' as const
    },
    {
      title: 'Compliance Rate',
      value: `${metrics?.complianceRate || 0}%`,
      subtitle: 'system compliance',
      icon: Award,
      status: getComplianceStatus(),
      trend: { value: 2, isPositive: true }
    },
    {
      title: 'Team Members',
      value: metrics?.totalMembers || 0,
      subtitle: 'across all teams',
      icon: Activity,
      status: 'good' as const
    },
    {
      title: 'Performance Score',
      value: `${metrics?.averagePerformance || 0}%`,
      subtitle: 'average team performance',
      icon: TrendingUp,
      status: getPerformanceStatus(),
      trend: { value: 3, isPositive: true }
    },
    {
      title: 'Response Time',
      value: '1.2s',
      subtitle: 'system response time',
      icon: Clock,
      status: 'good' as const,
      trend: { value: 15, isPositive: false }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">System Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time training management metrics</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
          System Healthy
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            status={metric.status}
            trend={metric.trend}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}