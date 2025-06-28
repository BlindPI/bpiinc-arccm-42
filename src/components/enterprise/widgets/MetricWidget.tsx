
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetricWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'healthy' | 'warning' | 'critical';
  onClick?: () => void;
}

export function MetricWidget({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  status = 'healthy',
  onClick 
}: MetricWidgetProps) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <Card 
      className={`transition-all hover:shadow-lg border-l-4 ${
        status === 'healthy' ? 'border-l-green-500' :
        status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'
      } ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${statusColors[status]}`} />
          <Badge 
            variant={status === 'healthy' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {trend && (
          <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
