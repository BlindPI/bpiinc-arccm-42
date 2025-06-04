import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target,
  BarChart3,
  PieChart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { crmOpportunityService } from '@/services/crm/crmOpportunityService';

interface ForecastData {
  forecasted_revenue: number;
  opportunities_closing: number;
  confidence_level: number;
}

interface PipelineValue {
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  opportunities_count: number;
  avg_deal_size: number;
}

interface SalesRepForecast {
  rep_id: string;
  rep_name: string;
  forecasted_revenue: number;
  opportunities_count: number;
  confidence_level: number;
  pipeline_value: number;
}

interface ForecastingDashboardProps {
  period?: 'month' | 'quarter' | 'year';
  onPeriodChange?: (period: 'month' | 'quarter' | 'year') => void;
}

export function ForecastingDashboard({ 
  period = 'month', 
  onPeriodChange 
}: ForecastingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>(period);
  const [forecastScenario, setForecastScenario] = useState<'conservative' | 'most_likely' | 'optimistic'>('most_likely');

  // Real forecasting calculations
  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['crm', 'forecast', selectedPeriod],
    queryFn: async () => {
      const result = await crmOpportunityService.getForecast(selectedPeriod);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 300000, // 5 minutes
  });

  // Pipeline value calculations
  const { data: pipelineValue, isLoading: pipelineLoading } = useQuery({
    queryKey: ['crm', 'pipeline-value'],
    queryFn: async () => {
      const result = await crmOpportunityService.calculatePipelineValue();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 300000,
  });

  // Mock sales rep forecasts (in real implementation, this would come from the backend)
  const salesRepForecasts: SalesRepForecast[] = [
    {
      rep_id: 'rep-1',
      rep_name: 'Sarah Johnson',
      forecasted_revenue: 125000,
      opportunities_count: 8,
      confidence_level: 85,
      pipeline_value: 280000
    },
    {
      rep_id: 'rep-2',
      rep_name: 'Mike Chen',
      forecasted_revenue: 95000,
      opportunities_count: 6,
      confidence_level: 78,
      pipeline_value: 210000
    },
    {
      rep_id: 'rep-3',
      rep_name: 'Emily Rodriguez',
      forecasted_revenue: 110000,
      opportunities_count: 7,
      confidence_level: 92,
      pipeline_value: 245000
    }
  ];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getPeriodLabel = (period: string) => {
    const labels = {
      month: 'This Month',
      quarter: 'This Quarter',
      year: 'This Year'
    };
    return labels[period as keyof typeof labels] || period;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScenarioMultiplier = (scenario: string) => {
    const multipliers = {
      conservative: 0.8,
      most_likely: 1.0,
      optimistic: 1.3
    };
    return multipliers[scenario as keyof typeof multipliers] || 1.0;
  };

  const calculateScenarioForecast = (baseForecast: number, scenario: string) => {
    return baseForecast * getScenarioMultiplier(scenario);
  };

  const handlePeriodChange = (newPeriod: 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  if (forecastLoading || pipelineLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Forecasting</h2>
          <p className="text-gray-600">
            Probability-adjusted revenue projections and pipeline analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forecastScenario} onValueChange={(value: any) => setForecastScenario(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="most_likely">Most Likely</SelectItem>
              <SelectItem value="optimistic">Optimistic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Forecast Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecasted Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {forecast ? formatCurrency(calculateScenarioForecast(forecast.forecasted_revenue, forecastScenario)) : '$0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {getPeriodLabel(selectedPeriod)} • {forecastScenario} scenario
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities Closing</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast?.opportunities_closing || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-blue-500" />
              Expected to close {getPeriodLabel(selectedPeriod).toLowerCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast ? formatPercentage(forecast.confidence_level) : '0%'}
            </div>
            <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              forecast ? getConfidenceColor(forecast.confidence_level) : 'bg-gray-100 text-gray-800'
            }`}>
              {forecast && forecast.confidence_level >= 80 ? 'High' : 
               forecast && forecast.confidence_level >= 60 ? 'Medium' : 'Low'} Confidence
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineValue ? formatCurrency(pipelineValue.weighted_pipeline_value) : '$0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mr-1 text-purple-500" />
              Weighted by probability
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scenario Planning</TabsTrigger>
          <TabsTrigger value="reps">Sales Rep Performance</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
        </TabsList>

        {/* Scenario Planning */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Scenarios</CardTitle>
              <CardDescription>
                Revenue projections based on different probability assumptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-700">Conservative (80%)</h4>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {forecast ? formatCurrency(calculateScenarioForecast(forecast.forecasted_revenue, 'conservative')) : '$0'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Assumes lower close rates and reduced deal sizes
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-700">Most Likely (100%)</h4>
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {forecast ? formatCurrency(forecast.forecasted_revenue) : '$0'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on current pipeline probabilities
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-700">Optimistic (130%)</h4>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {forecast ? formatCurrency(calculateScenarioForecast(forecast.forecasted_revenue, 'optimistic')) : '$0'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Assumes higher close rates and upselling
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historical Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Quarter</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Year</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">3 deals at risk of slipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">5 opportunities stalled 14+ days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">2 key decision makers on vacation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Rep Performance */}
        <TabsContent value="reps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Rep Forecasting</CardTitle>
              <CardDescription>
                Individual performance projections and pipeline health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Rep</TableHead>
                    <TableHead>Forecasted Revenue</TableHead>
                    <TableHead>Opportunities</TableHead>
                    <TableHead>Pipeline Value</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRepForecasts.map((rep) => (
                    <TableRow key={rep.rep_id}>
                      <TableCell>
                        <div className="font-medium">{rep.rep_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatCurrency(rep.forecasted_revenue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-blue-600" />
                          {rep.opportunities_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(rep.pipeline_value)}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getConfidenceColor(rep.confidence_level)}`}>
                          {formatPercentage(rep.confidence_level)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rep.confidence_level >= 85 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : rep.confidence_level >= 75 ? (
                            <Target className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {rep.confidence_level >= 85 ? 'Exceeding' : 
                             rep.confidence_level >= 75 ? 'On Track' : 'At Risk'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Analysis */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pipeline Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Pipeline Value</span>
                      <span className="text-sm font-bold">
                        {pipelineValue ? formatCurrency(pipelineValue.total_pipeline_value) : '$0'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Weighted Value</span>
                      <span className="text-sm font-bold text-green-600">
                        {pipelineValue ? formatCurrency(pipelineValue.weighted_pipeline_value) : '$0'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ 
                        width: pipelineValue ? `${(pipelineValue.weighted_pipeline_value / pipelineValue.total_pipeline_value) * 100}%` : '0%' 
                      }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Deal Size</span>
                      <span className="text-sm font-medium">
                        {pipelineValue ? formatCurrency(pipelineValue.avg_deal_size) : '$0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Opportunities</span>
                      <span className="text-sm font-medium">
                        {pipelineValue?.opportunities_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Velocity Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Sales Cycle</span>
                    <span className="text-sm font-medium">45 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Win Rate</span>
                    <span className="text-sm font-medium text-green-600">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time in Current Stage</span>
                    <span className="text-sm font-medium">12 days avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="text-sm font-medium text-blue-600">24%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}