
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface RevenueBySourceChartProps {
  className?: string;
}

export function RevenueBySourceChart({ className }: RevenueBySourceChartProps) {
  const [viewType, setViewType] = useState<'chart' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'revenue' | 'count'>('revenue');

  const { data: revenueBySource, isLoading, refetch } = useQuery({
    queryKey: ['revenue-by-source'],
    queryFn: () => RevenueAnalyticsService.getRevenueBySource()
  });

  const totalRevenue = revenueBySource?.reduce((sum, source) => sum + source.revenue, 0) || 0;
  const totalTransactions = revenueBySource?.reduce((sum, source) => sum + source.count, 0) || 0;

  const sortedData = revenueBySource?.sort((a, b) => {
    if (sortBy === 'revenue') {
      return b.revenue - a.revenue;
    }
    return b.count - a.count;
  }) || [];

  const getSourceDisplayName = (source: string) => {
    const sourceNames: Record<string, string> = {
      'website': 'Website',
      'referral': 'Referrals',
      'cold_call': 'Cold Calls',
      'email': 'Email Marketing',
      'social_media': 'Social Media',
      'trade_show': 'Trade Shows',
      'other': 'Other',
      'unknown': 'Unknown'
    };
    return sourceNames[source] || source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSourceColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue by Source</h2>
          <p className="text-muted-foreground">
            Revenue breakdown by lead source channels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={sortBy} onValueChange={(value: 'revenue' | 'count') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">By Revenue</SelectItem>
              <SelectItem value="count">By Count</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={(value: 'chart' | 'table') => setViewType(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table View</SelectItem>
              <SelectItem value="chart">Chart View</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All sources combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Revenue transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedData[0] ? getSourceDisplayName(sortedData[0].source) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {sortedData[0] ? formatCurrency(sortedData[0].revenue) : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Source Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewType === 'chart' ? <PieChart className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
            Revenue Source Breakdown
          </CardTitle>
          <CardDescription>
            {sortBy === 'revenue' ? 'Sorted by revenue amount' : 'Sorted by transaction count'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedData.map((source, index) => {
              const percentage = totalRevenue > 0 ? (source.revenue / totalRevenue) * 100 : 0;
              const avgTransactionValue = source.count > 0 ? source.revenue / source.count : 0;

              return (
                <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${getSourceColor(index)}`} />
                    <div className="flex flex-col">
                      <span className="font-medium">{getSourceDisplayName(source.source)}</span>
                      <span className="text-sm text-muted-foreground">
                        {source.count} transactions • Avg: {formatCurrency(avgTransactionValue)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(source.revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="outline">
                        {percentage.toFixed(1)}%
                      </Badge>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getSourceColor(index)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sortedData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No revenue source data available</p>
                <p className="text-sm">Revenue data will appear here once transactions are recorded</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Source Performance Insights</CardTitle>
          <CardDescription>
            Key metrics and recommendations for lead source optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Highest Value Sources</h4>
              <div className="space-y-2">
                {sortedData.slice(0, 3).map((source, index) => (
                  <div key={source.source} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{getSourceDisplayName(source.source)}</span>
                    <Badge variant="default">
                      {formatCurrency(source.revenue / source.count)} avg
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Most Active Sources</h4>
              <div className="space-y-2">
                {[...sortedData].sort((a, b) => b.count - a.count).slice(0, 3).map((source) => (
                  <div key={source.source} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{getSourceDisplayName(source.source)}</span>
                    <Badge variant="secondary">
                      {source.count} transactions
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
