
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  DollarSign
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

interface RevenueForecastingProps {
  className?: string;
}

export function RevenueForecasting({ className }: RevenueForecastingProps) {
  const [forecastPeriods, setForecastPeriods] = useState<number>(6);

  const { data: revenueForecast, isLoading, refetch } = useQuery({
    queryKey: ['revenue-forecast', forecastPeriods],
    queryFn: () => RevenueAnalyticsService.getRevenueForecast(forecastPeriods)
  });

  const totalForecast = revenueForecast?.reduce((sum, period) => sum + period.predicted, 0) || 0;
  const avgConfidence = revenueForecast?.length 
    ? revenueForecast.reduce((sum, period) => sum + period.confidence, 0) / revenueForecast.length
    : 0;

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
          <h2 className="text-2xl font-bold tracking-tight">Revenue Forecasting</h2>
          <p className="text-muted-foreground">
            Predictive analytics using opportunity data and probability weighting
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={forecastPeriods.toString()} onValueChange={(value) => setForecastPeriods(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
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
            <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalForecast)}</div>
            <p className="text-xs text-muted-foreground">
              Next {forecastPeriods} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Weighted probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributing Opps</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueForecast?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Forecast periods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Forecast Breakdown
          </CardTitle>
          <CardDescription>
            Period-by-period revenue projections based on opportunity close dates and probabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueForecast?.map((forecast, index) => {
              const prevForecast = revenueForecast[index - 1];
              const growth = prevForecast 
                ? ((forecast.predicted - prevForecast.predicted) / prevForecast.predicted) * 100
                : 0;

              return (
                <div key={forecast.month} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{forecast.month}</span>
                      <span className="text-sm text-muted-foreground">
                        Forecast period
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(forecast.predicted)}</div>
                      <div className="text-sm text-muted-foreground">
                        {forecast.confidence.toFixed(1)}% confidence
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant={
                          forecast.confidence > 70 ? "default" : 
                          forecast.confidence > 40 ? "secondary" : 
                          "outline"
                        }
                      >
                        {forecast.confidence > 70 ? "High" : 
                         forecast.confidence > 40 ? "Medium" : "Low"}
                      </Badge>
                      
                      {index > 0 && (
                        <Badge variant={growth > 0 ? "default" : growth < 0 ? "destructive" : "secondary"}>
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
                  </div>
                </div>
              );
            })}
            
            {(!revenueForecast || revenueForecast.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No forecast data available</p>
                <p className="text-sm">Add opportunities with close dates to generate forecasts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Methodology</CardTitle>
          <CardDescription>
            How we calculate revenue forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Weighted Pipeline Value</h4>
              <p className="text-sm text-muted-foreground">
                Each opportunity's value is multiplied by its probability percentage to create a weighted forecast amount.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Time-based Grouping</h4>
              <p className="text-sm text-muted-foreground">
                Opportunities are grouped by their expected close date into monthly periods.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Confidence Levels</h4>
              <p className="text-sm text-muted-foreground">
                High (70%+), Medium (40-70%), and Low (&lt;40%) confidence based on average opportunity probability.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Growth Trends</h4>
              <p className="text-sm text-muted-foreground">
                Period-over-period growth indicators help identify forecast trends and seasonality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
