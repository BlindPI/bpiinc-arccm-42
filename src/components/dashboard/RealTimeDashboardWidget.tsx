
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  value?: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  isLoading?: boolean;
  onRefresh?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  realTime?: boolean;
}

export function RealTimeDashboardWidget({
  title,
  icon: Icon,
  value,
  change,
  status,
  isLoading = false,
  onRefresh,
  actions,
  children,
  size = 'md',
  realTime = false
}: DashboardWidgetProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (realTime) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        onRefresh?.();
      }, 30000); // Update every 30 seconds for real-time widgets

      return () => clearInterval(interval);
    }
  }, [realTime, onRefresh]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const sizeClasses = {
    sm: 'col-span-1',
    md: 'col-span-2',
    lg: 'col-span-3'
  };

  return (
    <Card className={cn('relative', sizeClasses[size])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
          {realTime && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {status && (
            <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        ) : (
          <>
            {value !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{value}</span>
                {change && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {change.type === 'increase' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={cn(
                      'text-xs',
                      change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {change.value}% {change.period}
                    </span>
                  </Badge>
                )}
              </div>
            )}
            {children}
            {realTime && (
              <div className="mt-2 text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
