
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { ProviderAnalyticsService } from '@/services/analytics/providerAnalyticsService';
import { 
  TrendingUp, TrendingDown, Users, Building2, 
  Award, AlertTriangle, BarChart3, Download,
  Calendar, Filter, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type TimePeriod = '30d' | '90d' | '1y';

export const AdvancedProviderAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => ProviderAnalyticsService.getAnalyticsDashboard()
  });

  const { data: providerMetrics } = useQuery({
    queryKey: ['provider-metrics', selectedProvider, selectedPeriod],
    queryFn: () => selectedProvider 
      ? ProviderAnalyticsService.getProviderPerformanceMetrics(selectedProvider, selectedPeriod)
      : null,
    enabled: !!selectedProvider
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Advanced performance metrics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Providers</p>
                  <p className="text-2xl font-bold text-blue-900">{dashboardData.overview.totalProviders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Teams</p>
                  <p className="text-2xl font-bold text-green-900">{dashboardData.overview.totalTeams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Certificates</p>
                  <p className="text-2xl font-bold text-purple-900">{dashboardData.overview.totalCertificates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Avg Compliance</p>
                  <p className="text-2xl font-bold text-orange-900">{dashboardData.overview.averageCompliance.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.trends.monthly && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.trends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{alert.type}</span>
                </div>
                <p className="text-sm">{alert.message}</p>
                {alert.actionRequired && (
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Take Action
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top and Risk Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.topPerformers.map((provider, index) => (
                <div key={provider.providerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{provider.providerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.metrics.totalTeams} teams, {provider.metrics.certificatesIssued} certs
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">
                    {provider.metrics.complianceScore}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Risk Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.riskProviders.map((provider) => (
                <div key={provider.providerId} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{provider.providerName}</p>
                      <p className="text-sm text-red-600">
                        Compliance: {provider.metrics.complianceScore}%
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
