
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface TeamKPICardsProps {
  metrics: {
    teamSize: number;
    activeCourses: number;
    totalCertificates: number;
    teamPerformance: number;
    monthlyProgress: number;
    weeklyActivity: number;
    complianceScore?: number;
    avgSatisfaction?: number;
  };
  comparisonData?: {
    lastMonth: any;
    organizationAverage: any;
  };
  isLoading?: boolean;
}

export function TeamKPICards({ metrics, comparisonData, isLoading }: TeamKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3" />;
    if (current < previous) return <TrendingUp className="h-3 w-3 rotate-180" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const kpiCards = [
    {
      title: 'Team Size',
      value: metrics.teamSize,
      icon: Users,
      color: 'from-blue-50 to-white',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      description: 'Active members',
      trend: comparisonData?.lastMonth?.teamSize,
    },
    {
      title: 'Active Courses',
      value: metrics.activeCourses,
      icon: BookOpen,
      color: 'from-green-50 to-white',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      description: 'Scheduled courses',
      trend: comparisonData?.lastMonth?.activeCourses,
    },
    {
      title: 'Certificates Issued',
      value: metrics.totalCertificates,
      icon: Award,
      color: 'from-purple-50 to-white',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      description: 'Total certificates',
      trend: comparisonData?.lastMonth?.totalCertificates,
    },
    {
      title: 'Team Performance',
      value: `${metrics.teamPerformance}%`,
      icon: Target,
      color: 'from-amber-50 to-white',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      description: 'Performance score',
      trend: comparisonData?.lastMonth?.teamPerformance,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => {
          const IconComponent = kpi.icon;
          const hasTrend = kpi.trend !== undefined;
          
          return (
            <Card key={index} className={`bg-gradient-to-br ${kpi.color} border-0 shadow-md hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${kpi.iconColor}`} />
                    {kpi.title}
                  </span>
                  {hasTrend && (
                    <div className={`flex items-center gap-1 text-xs ${getTrendColor(Number(metrics.teamPerformance), kpi.trend)}`}>
                      {getTrendIcon(Number(metrics.teamPerformance), kpi.trend)}
                      {Math.abs(Number(metrics.teamPerformance) - kpi.trend)}%
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <p className="text-xs text-gray-500">{kpi.description}</p>
                {comparisonData?.organizationAverage && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Org avg: {comparisonData.organizationAverage[kpi.title.toLowerCase().replace(' ', '_')] || 'N/A'}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.monthlyProgress}%</div>
            <p className="text-xs text-gray-500">This month's progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.weeklyActivity}%</div>
            <p className="text-xs text-gray-500">Activity level</p>
          </CardContent>
        </Card>

        {metrics.complianceScore && (
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                {metrics.complianceScore >= 90 ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : metrics.complianceScore >= 70 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.complianceScore}%</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant={metrics.complianceScore >= 90 ? "default" : metrics.complianceScore >= 70 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {metrics.complianceScore >= 90 ? 'Excellent' : metrics.complianceScore >= 70 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
