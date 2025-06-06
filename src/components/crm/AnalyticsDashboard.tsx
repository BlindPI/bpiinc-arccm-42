import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdvancedAnalyticsService, AnalyticsMetrics, TimeSeriesData, ConversionFunnel, UserPerformance, PredictiveInsights } from '@/services/crm/advancedAnalyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Mail,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Zap,
  Award,
  Brain,
  Lightbulb
} from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [dateRange, setDateRange] = useState('90');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  // Fetch analytics metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['analytics-metrics', dateRange],
    queryFn: () => AdvancedAnalyticsService.getAnalyticsMetrics(getDateRange())
  });

  // Fetch time series data
  const { data: timeSeriesData = [], isLoading: isLoadingTimeSeries } = useQuery({
    queryKey: ['time-series-data', dateRange],
    queryFn: () => AdvancedAnalyticsService.getTimeSeriesData(parseInt(dateRange))
  });

  // Fetch conversion funnel
  const { data: conversionFunnel = [], isLoading: isLoadingFunnel } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: AdvancedAnalyticsService.getConversionFunnel
  });

  // Fetch user performance
  const { data: userPerformance = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-performance'],
    queryFn: AdvancedAnalyticsService.getUserPerformance
  });

  // Fetch predictive insights
  const { data: predictiveInsights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: AdvancedAnalyticsService.getPredictiveInsights
  });

  const isLoading = isLoadingMetrics || isLoadingTimeSeries || isLoadingFunnel || isLoadingUsers || isLoadingInsights;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and predictive analytics for your CRM
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metrics.revenue_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.revenue_growth_rate >= 0 ? '+' : ''}{formatPercentage(metrics.revenue_growth_rate)}
                </span>
                {' '}from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.total_pipeline_value)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.total_opportunities} opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(metrics.win_rate)}</div>
              <Progress value={metrics.win_rate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.sales_velocity)}</div>
              <p className="text-xs text-muted-foreground">
                per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.total_leads)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.new_leads_this_month} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(metrics.lead_conversion_rate)}</div>
              <Progress value={metrics.lead_conversion_rate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.average_deal_size)}</div>
              <p className="text-xs text-muted-foreground">
                per closed deal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(metrics.task_completion_rate)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.overdue_tasks} overdue tasks
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="mr-2 h-5 w-5" />
                  Revenue & Activity Trends
                </CardTitle>
                <CardDescription>
                  Track revenue, leads, and activities over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="leads"
                      stroke="#82ca9d"
                      name="Leads"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="opportunities"
                      stroke="#ffc658"
                      name="Opportunities"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5" />
                  Lead Sources
                </CardTitle>
                <CardDescription>Distribution of lead sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics?.leads_by_source || {}).map(([source, count]) => ({
                        name: source,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(metrics?.leads_by_source || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue by Source
                </CardTitle>
                <CardDescription>Revenue attribution by lead source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={Object.entries(metrics?.revenue_by_source || {}).map(([source, revenue]) => ({
                      source,
                      revenue
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Revenue */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Monthly Revenue Performance</CardTitle>
                <CardDescription>Revenue trends over the past months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.revenue_by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical business metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Acquisition Cost</span>
                    <span className="font-medium">{formatCurrency(metrics?.customer_acquisition_cost || 0)}</span>
                  </div>
                  <Progress value={Math.min(100, (metrics?.customer_acquisition_cost || 0) / 1000 * 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Lifetime Value</span>
                    <span className="font-medium">{formatCurrency(metrics?.lifetime_value || 0)}</span>
                  </div>
                  <Progress value={Math.min(100, (metrics?.lifetime_value || 0) / 10000 * 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Churn Rate</span>
                    <span className="font-medium">{formatPercentage(metrics?.churn_rate || 0)}</span>
                  </div>
                  <Progress value={metrics?.churn_rate || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Campaign Open Rate</span>
                    <span className="font-medium">{formatPercentage(metrics?.campaign_open_rate || 0)}</span>
                  </div>
                  <Progress value={metrics?.campaign_open_rate || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>Distribution of activities by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics?.activities_by_type || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Sales Conversion Funnel
              </CardTitle>
              <CardDescription>
                Track how leads progress through your sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{stage.count} opportunities</span>
                        <Badge variant={stage.conversion_rate > 50 ? "default" : "secondary"}>
                          {formatPercentage(stage.conversion_rate)} conversion
                        </Badge>
                      </div>
                    </div>
                    <Progress value={stage.conversion_rate} className="h-3" />
                    {stage.drop_off_rate > 0 && (
                      <p className="text-xs text-red-600">
                        {formatPercentage(stage.drop_off_rate)} drop-off rate
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Team Performance
              </CardTitle>
              <CardDescription>
                Individual performance metrics and rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPerformance
                  .sort((a, b) => b.performance_score - a.performance_score)
                  .slice(0, 10)
                  .map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {user.performance_score.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center text-sm">
                        <div>
                          <p className="font-medium">{user.leads_generated}</p>
                          <p className="text-muted-foreground">Leads</p>
                        </div>
                        <div>
                          <p className="font-medium">{user.deals_won}</p>
                          <p className="text-muted-foreground">Deals</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(user.revenue_generated)}</p>
                          <p className="text-muted-foreground">Revenue</p>
                        </div>
                        <div>
                          <p className="font-medium">{user.tasks_completed}</p>
                          <p className="text-muted-foreground">Tasks</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {predictiveInsights && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Forecast */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    Revenue Forecast
                  </CardTitle>
                  <CardDescription>
                    AI-powered revenue predictions for the next 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={predictiveInsights.revenue_forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line
                        type="monotone"
                        dataKey="predicted_revenue"
                        stroke="#8884d8"
                        strokeDasharray="5 5"
                        name="Predicted Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Recommended Actions
                  </CardTitle>
                  <CardDescription>AI-generated recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveInsights.recommended_actions.map((action, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Badge variant={action.priority === 1 ? "destructive" : "secondary"} className="mt-0.5">
                            P{action.priority}
                          </Badge>
                          <div>
                            <p className="font-medium capitalize">{action.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Churn Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Churn Risk Analysis
                  </CardTitle>
                  <CardDescription>Leads at risk of churning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveInsights.churn_risk_leads.slice(0, 5).map((lead) => (
                      <div key={lead.lead_id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Lead {lead.lead_id.slice(0, 8)}</span>
                          <Badge variant="destructive">
                            {lead.risk_score}% risk
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {lead.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};