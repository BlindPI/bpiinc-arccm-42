
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdvancedAnalyticsService, ConversionFunnelData, SalesRepPerformance } from '@/services/crm/advancedAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => AdvancedAnalyticsService.getAnalyticsMetrics()
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: () => AdvancedAnalyticsService.getConversionFunnelData()
  });

  const { data: sourcePerformance, isLoading: sourceLoading } = useQuery({
    queryKey: ['lead-source-performance'],
    queryFn: () => AdvancedAnalyticsService.getLeadSourcePerformance()
  });

  const { data: salesRepPerformance, isLoading: repLoading } = useQuery({
    queryKey: ['sales-rep-performance'],
    queryFn: () => AdvancedAnalyticsService.getSalesRepPerformance()
  });

  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['time-series-data'],
    queryFn: () => AdvancedAnalyticsService.getTimeSeriesData()
  });

  const { data: predictiveInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: () => AdvancedAnalyticsService.getPredictiveInsights()
  });

  if (metricsLoading || funnelLoading || sourceLoading || repLoading || timeSeriesLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pipeline Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.monthlyGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        {/* Total Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOpportunities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active in pipeline
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate?.toFixed(1) || 0}%</div>
            <Progress value={metrics?.conversionRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time leads
            </p>
          </CardContent>
        </Card>

        {/* Average Deal Size */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.avgDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per closed deal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData?.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{stage.count}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({stage.conversionRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <Progress value={stage.conversionRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalLeads" fill="#8884d8" name="Total Leads" />
                <Bar dataKey="convertedLeads" fill="#82ca9d" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Rep Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Rep Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesRepPerformance?.slice(0, 5).map((rep) => (
              <div key={rep.repId} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{rep.repName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {rep.totalLeads} leads • {rep.convertedLeads} converted
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatCurrency(rep.totalRevenue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rep.conversionRate.toFixed(1)}% conversion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      {predictiveInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Revenue Forecast</h4>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(predictiveInsights.revenue_forecast)}
                </p>
                <p className="text-sm text-blue-600">Next quarter projection</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <ul className="space-y-1">
                  {predictiveInsights.recommended_actions.map((action, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {predictiveInsights.churn_risk_leads.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    High Churn Risk Leads
                  </h4>
                  <div className="space-y-2">
                    {predictiveInsights.churn_risk_leads.map((lead) => (
                      <div key={lead.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{lead.name}</h5>
                            <ul className="text-xs text-red-600 mt-1">
                              {lead.reasons.map((reason, index) => (
                                <li key={index}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                          <Badge variant="destructive">
                            {lead.risk_score}% risk
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
