
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Users, Award, Clock, Target, Download, RefreshCw,
  BarChart3, PieChart, Activity, Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProviderAnalyticsService } from '@/services/analytics/providerAnalyticsService';
import { PageHeader } from '@/components/ui/PageHeader';

export const AdvancedProviderAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '1y'>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['provider-analytics-dashboard'],
    queryFn: () => ProviderAnalyticsService.getAnalyticsDashboard()
  });

  const { data: providerMetrics } = useQuery({
    queryKey: ['provider-metrics', selectedProvider, selectedPeriod],
    queryFn: () => selectedProvider 
      ? ProviderAnalyticsService.getProviderPerformanceMetrics(selectedProvider, selectedPeriod)
      : null,
    enabled: !!selectedProvider
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-7 w-7 text-primary" />}
        title="Advanced Provider Analytics"
        subtitle="Comprehensive performance insights and predictive analytics"
        actions={
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* System Alerts */}
      {dashboard?.alerts && dashboard.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            System Alerts
          </h3>
          {dashboard.alerts.map((alert) => (
            <Alert key={alert.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    {alert.providerId && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Provider ID: {alert.providerId}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {alert.actionRequired && (
                      <Button size="sm">Take Action</Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {dashboard?.overview.totalProviders || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Providers</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {dashboard?.overview.totalTeams || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Teams</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {dashboard?.overview.totalCertificates || 0}
              </div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {dashboard?.overview.averageCompliance?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Compliance</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.topPerformers?.map((provider, index) => (
                    <div key={provider.providerId} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{provider.providerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {provider.metrics.totalTeams} teams • {provider.metrics.certificatesIssued} certificates
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {provider.metrics.complianceScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Compliance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.riskProviders?.map((provider) => (
                    <div key={provider.providerId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium">{provider.providerName}</div>
                        <div className="text-sm text-muted-foreground">
                          Compliance: {provider.metrics.complianceScore.toFixed(1)}% • 
                          Completion: {provider.metrics.completionRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          At Risk
                        </Badge>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.riskProviders || dashboard.riskProviders.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>All providers meeting performance standards</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Provider Metrics */}
          {providerMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>{providerMetrics.providerName} - Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {providerMetrics.metrics.totalTeams}
                    </div>
                    <div className="text-sm text-muted-foreground">Teams</div>
                    <div className="flex items-center justify-center mt-1">
                      {getTrendIcon(providerMetrics.trends.teamGrowth)}
                      <span className="text-xs ml-1">{providerMetrics.trends.teamGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {providerMetrics.metrics.certificatesIssued}
                    </div>
                    <div className="text-sm text-muted-foreground">Certificates</div>
                    <div className="flex items-center justify-center mt-1">
                      {getTrendIcon(providerMetrics.trends.certificationTrend)}
                      <span className="text-xs ml-1">{providerMetrics.trends.certificationTrend.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(providerMetrics.metrics.complianceScore)}`}>
                      {providerMetrics.metrics.complianceScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Compliance</div>
                    <div className="flex items-center justify-center mt-1">
                      {getTrendIcon(providerMetrics.trends.complianceImprovement)}
                      <span className="text-xs ml-1">{providerMetrics.trends.complianceImprovement.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {providerMetrics.metrics.customerSatisfaction.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Satisfaction</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      out of 100
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Compliance Score vs Target</span>
                      <span>{providerMetrics.metrics.complianceScore.toFixed(1)}% / {providerMetrics.benchmarks.targetGoal}%</span>
                    </div>
                    <Progress value={providerMetrics.metrics.complianceScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span>{providerMetrics.metrics.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={providerMetrics.metrics.completionRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Trend Analytics</h3>
                <p>Advanced trend analysis charts would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Compliance Dashboard</h3>
                <p>Detailed compliance metrics and automated checks</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Benchmark Analysis</h3>
                <p>Comparative analysis against industry standards</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedProviderAnalytics;
