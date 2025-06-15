
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Users, DollarSign, Clock } from 'lucide-react';

interface SalesPerformanceMetricsProps {
  data?: any;
  period: string;
}

export function SalesPerformanceMetrics({ data, period }: SalesPerformanceMetricsProps) {
  const metrics = [
    {
      title: 'Total Pipeline Value',
      value: '$4.8M',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Conversion Rate',
      value: '23.8%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Average Deal Size',
      value: '$125K',
      change: '-3.2%',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Sales Cycle',
      value: '45 days',
      change: '-5.1%',
      trend: 'up',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Active Leads',
      value: '1,247',
      change: '+18.7%',
      trend: 'up',
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      title: 'Win Rate',
      value: '68.5%',
      change: '+4.3%',
      trend: 'up',
      icon: Target,
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
                    <span className={`text-xs font-medium ${trendColor}`}>
                      {metric.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      vs last {period}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-50`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
