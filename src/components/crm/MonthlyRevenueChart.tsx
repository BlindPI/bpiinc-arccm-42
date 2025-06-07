
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { RevenueAnalyticsService, MonthlyRevenueData } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface MonthlyRevenueChartProps {
  months?: number;
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ months = 6 }) => {
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['monthly-revenue', months],
    queryFn: () => RevenueAnalyticsService.getMonthlyRevenueComparison(months)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !revenueData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Error loading revenue data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Unable to load revenue data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend and stats
  const totalRevenue = revenueData.reduce((sum, month) => sum + month.revenue, 0);
  const averageRevenue = totalRevenue / revenueData.length;
  const latestMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];
  
  const monthOverMonthGrowth = previousMonth 
    ? ((latestMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
    : 0;

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Monthly Revenue Trend
        </CardTitle>
        <CardDescription>
          Revenue performance over the last {months} months
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Average Monthly</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(averageRevenue)}
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Month-over-Month</div>
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              monthOverMonthGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthOverMonthGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {Math.abs(monthOverMonthGrowth).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="space-y-4">
          <h4 className="font-medium">Monthly Breakdown</h4>
          <div className="space-y-3">
            {revenueData.map((month, index) => {
              const barWidth = (month.revenue / maxRevenue) * 100;
              const isLatest = index === revenueData.length - 1;
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{month.month}</span>
                      {isLatest && (
                        <Badge variant="secondary" className="text-xs">Latest</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(month.revenue)} • {month.deals} deals
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isLatest ? 'bg-blue-600' : 'bg-blue-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Key Insights</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Best performing month: {revenueData.find(m => m.revenue === maxRevenue)?.month} 
              ({formatCurrency(maxRevenue)})
            </li>
            <li>• Average deal value: {formatCurrency(totalRevenue / revenueData.reduce((sum, m) => sum + m.deals, 0))}</li>
            <li>• Growth trend: {monthOverMonthGrowth >= 0 ? 'Positive' : 'Negative'} month-over-month</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyRevenueChart;
