
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { AdvancedAnalyticsService, AnalyticsMetrics } from '@/services/crm/advancedAnalyticsService';
import { formatCurrency } from '@/lib/utils';

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  const { data: analyticsMetrics, isLoading, error } = useQuery({
    queryKey: ['analytics-metrics', dateRange],
    queryFn: () => AdvancedAnalyticsService.getAnalyticsMetrics()
  });

  const { data: conversionFunnel } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: () => AdvancedAnalyticsService.getConversionFunnel()
  });

  const { data: userPerformance } = useQuery({
    queryKey: ['user-performance'],
    queryFn: () => AdvancedAnalyticsService.getUserPerformance()
  });

  const { data: predictiveInsights } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: () => AdvancedAnalyticsService.getPredictiveInsights()
  });

  const handleRefresh = () => {
    // Trigger refetch of all queries
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
              <p className="text-gray-500 mb-4">There was an error loading the analytics data.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = analyticsMetrics || {
    totalLeads: 0,
    totalOpportunities: 0,
    conversionRate: 0,
    averageDealSize: 0,
    totalRevenue: 0,
    totalPipelineValue: 0,
    winRate: 0
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">
                {metrics.revenueGrowthRate || 0}%
              </span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPipelineValue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalOpportunities || 0} opportunities
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.winRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Closed opportunities</p>
          </CardContent>
        </Card>

        {/* Sales Velocity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.salesVelocity || 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">Average close time</p>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.newLeadsThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Lead to opportunity</p>
          </CardContent>
        </Card>

        {/* Average Deal Size */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageDealSize || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per closed deal</p>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.taskCompletionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overdueTasks || 0} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
                <CardDescription>Distribution of lead sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.leadsBySource?.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-blue-${500 + (index * 100)}`} />
                        <span className="text-sm font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.count}</div>
                        <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No lead source data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Revenue breakdown by lead source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.revenueBySource?.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-green-${500 + (index * 100)}`} />
                        <span className="text-sm font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(source.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No revenue data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Revenue Chart</h3>
                    <p>Chart visualization coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Acquisition Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.customerAcquisitionCost || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.lifetimeValue || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.churnRate || 0).toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Email Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.campaignOpenRate || 0).toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Activities by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Activities by Type</CardTitle>
              <CardDescription>Breakdown of CRM activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.activitiesByType?.map((activity, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{activity.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{activity.type}</div>
                  </div>
                )) || (
                  <div className="col-span-4 text-center text-muted-foreground py-8">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No activity data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Lead conversion rates by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel?.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-muted-foreground">
                          {stage.count} ({stage.conversionRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stage.conversionRate}%` }}
                        ></div>
                      </div>
                      {index > 0 && (
                        <div className="text-xs text-red-500">
                          Drop-off: {stage.dropOffRate || 0}%
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No funnel data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Sales team performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPerformance?.sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                    .slice(0, 5)
                    .map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {user.performanceScore || 0}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div>Leads: {user.leadsGenerated}</div>
                        <div>Deals: {user.dealsWon}</div>
                        <div>Revenue: {formatCurrency(user.revenueGenerated || user.revenue)}</div>
                        <div>Tasks: {user.tasksCompleted || 0}</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>AI-powered revenue predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {formatCurrency(predictiveInsights?.revenueForecast || 0)}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Recommended Actions:</h4>
                  <ul className="space-y-1">
                    {predictiveInsights?.recommendedActions?.map((action, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                        {action}
                      </li>
                    )) || (
                      <li className="text-sm text-muted-foreground">No recommendations available</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Churn Risk */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Analysis</CardTitle>
                <CardDescription>Leads at risk of churning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveInsights?.churnRiskLeads?.map((lead, index) => (
                    <div key={lead.leadId} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Lead #{lead.leadId}</span>
                        <Badge variant={lead.riskScore > 80 ? "destructive" : lead.riskScore > 60 ? "default" : "secondary"}>
                          Risk: {lead.riskScore}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="mb-1">Reasons:</div>
                        <ul className="space-y-1">
                          {lead.reasons?.map((reason, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No churn risk data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
