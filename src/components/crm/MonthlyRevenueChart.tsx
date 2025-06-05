import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface MonthlyRevenueChartProps {
  className?: string;
}

export function MonthlyRevenueChart({ className }: MonthlyRevenueChartProps) {
  const [monthsToShow, setMonthsToShow] = useState<number>(12);
  const [viewType, setViewType] = useState<'total' | 'breakdown'>('total');

  const { data: monthlyData, isLoading, refetch } = useQuery({
    queryKey: ['monthly-revenue-comparison', monthsToShow],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison(monthsToShow)
  });

  const totalRevenue = monthlyData?.reduce((sum, month) => sum + month.total_revenue, 0) || 0;
  const avgMonthlyRevenue = monthlyData?.length ? totalRevenue / monthlyData.length : 0;
  const bestMonth = monthlyData?.reduce((best, month) => 
    month.total_revenue > (best?.total_revenue || 0) ? month : best
  );

  const getMonthGrowth = (currentMonth: any, index: number) => {
    if (index === 0 || !monthlyData) return 0;
    const prevMonth = monthlyData[index - 1];
    if (prevMonth.total_revenue === 0) return 0;
    return ((currentMonth.total_revenue - prevMonth.total_revenue) / prevMonth.total_revenue) * 100;
  };

  const getMaxRevenue = () => {
    return Math.max(...(monthlyData?.map(m => m.total_revenue) || [0]));
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
          <h2 className="text-2xl font-bold tracking-tight">Monthly Revenue Trends</h2>
          <p className="text-muted-foreground">
            Time-series revenue visualization and growth analysis
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={monthsToShow.toString()} onValueChange={(value) => setMonthsToShow(parseInt(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
              <SelectItem value="18">18 Months</SelectItem>
              <SelectItem value="24">24 Months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={(value: 'total' | 'breakdown') => setViewType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Total Revenue</SelectItem>
              <SelectItem value="breakdown">Revenue Breakdown</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Last {monthsToShow} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Average per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestMonth ? formatCurrency(bestMonth.total_revenue) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {bestMonth ? bestMonth.month : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Growth</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData && monthlyData.length > 1 ? 
                `${getMonthGrowth(monthlyData[monthlyData.length - 1], monthlyData.length - 1).toFixed(1)}%` : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Month-over-month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Revenue Chart
          </CardTitle>
          <CardDescription>
            {viewType === 'total' ? 'Total revenue by month' : 'Revenue breakdown by type'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData?.map((month, index) => {
              const growth = getMonthGrowth(month, index);
              const maxRevenue = getMaxRevenue();
              const barWidth = maxRevenue > 0 ? (month.total_revenue / maxRevenue) * 100 : 0;

              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm w-20">{month.month}</span>
                      {index > 0 && (
                        <Badge variant={growth > 0 ? "success" : growth < 0 ? "destructive" : "secondary"}>
                          {growth > 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{growth.toFixed(1)}%
                            </>
                          ) : growth < 0 ? (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {growth.toFixed(1)}%
                            </>
                          ) : (
                            "No change"
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(month.total_revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        {month.transaction_count} transactions
                      </div>
                    </div>
                  </div>
                  
                  {viewType === 'total' ? (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                      <div 
                        className="bg-blue-500 h-3 transition-all duration-300"
                        style={{ 
                          width: `${maxRevenue > 0 ? (month.certificate_revenue / maxRevenue) * 100 : 0}%` 
                        }}
                        title={`Certificate Revenue: ${formatCurrency(month.certificate_revenue)}`}
                      />
                      <div 
                        className="bg-green-500 h-3 transition-all duration-300"
                        style={{ 
                          width: `${maxRevenue > 0 ? (month.corporate_revenue / maxRevenue) * 100 : 0}%` 
                        }}
                        title={`Corporate Revenue: ${formatCurrency(month.corporate_revenue)}`}
                      />
                    </div>
                  )}
                  
                  {viewType === 'breakdown' && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cert: {formatCurrency(month.certificate_revenue)}</span>
                      <span>Corp: {formatCurrency(month.corporate_revenue)}</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {(!monthlyData || monthlyData.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No monthly revenue data available</p>
                <p className="text-sm">Revenue data will appear here once transactions are recorded</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Legend */}
      {viewType === 'breakdown' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Type Legend</CardTitle>
            <CardDescription>
              Understanding the revenue breakdown visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <div>
                  <div className="font-medium">Certificate Revenue</div>
                  <div className="text-sm text-muted-foreground">Individual certification fees</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <div>
                  <div className="font-medium">Corporate Revenue</div>
                  <div className="text-sm text-muted-foreground">Corporate training contracts</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>
            Key insights from monthly revenue patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Growth Trend</h4>
              <p className="text-sm text-muted-foreground">
                {monthlyData && monthlyData.length > 1 ? (
                  (() => {
                    const recentGrowth = monthlyData.slice(-3).map((month, index, arr) => 
                      index > 0 ? getMonthGrowth(month, index) : 0
                    ).filter(g => g !== 0);
                    const avgGrowth = recentGrowth.length > 0 ? 
                      recentGrowth.reduce((sum, g) => sum + g, 0) / recentGrowth.length : 0;
                    
                    return avgGrowth > 5 ? 'Strong upward trend' :
                           avgGrowth > 0 ? 'Moderate growth' :
                           avgGrowth > -5 ? 'Stable performance' :
                           'Declining trend';
                  })()
                ) : 'Insufficient data'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Seasonality</h4>
              <p className="text-sm text-muted-foreground">
                {monthlyData && monthlyData.length >= 12 ? 
                  'Seasonal patterns detected' : 
                  'Need 12+ months for seasonal analysis'
                }
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Consistency</h4>
              <p className="text-sm text-muted-foreground">
                {monthlyData && monthlyData.length > 0 ? (
                  (() => {
                    const revenues = monthlyData.map(m => m.total_revenue);
                    const avg = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
                    const variance = revenues.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / revenues.length;
                    const stdDev = Math.sqrt(variance);
                    const coefficient = avg > 0 ? (stdDev / avg) : 0;
                    
                    return coefficient < 0.2 ? 'Very consistent' :
                           coefficient < 0.4 ? 'Moderately consistent' :
                           'High variability';
                  })()
                ) : 'No data available'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}