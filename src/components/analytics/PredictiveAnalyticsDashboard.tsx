
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Activity,
  BarChart3,
  Zap,
  RefreshCw
} from 'lucide-react';
import { AdvancedTrendService } from '@/services/analytics/advancedTrendService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function PredictiveAnalyticsDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: predictiveMetrics, isLoading, refetch } = useQuery({
    queryKey: ['predictive-metrics', refreshKey],
    queryFn: () => AdvancedTrendService.generatePredictiveMetrics(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
          <p className="text-muted-foreground">AI-powered insights and forecasting</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Growth</p>
                <p className="text-2xl font-bold">
                  {predictiveMetrics?.teamGrowthForecast.growth.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(predictiveMetrics?.teamGrowthForecast.trend || 'stable')}
            </div>
            <Badge variant="outline" className="mt-2">
              {predictiveMetrics?.teamGrowthForecast.confidence}% confidence
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Risk</p>
                <p className={`text-2xl font-bold ${getRiskColor(predictiveMetrics?.complianceRiskScore || 0)}`}>
                  {predictiveMetrics?.complianceRiskScore}%
                </p>
              </div>
              <AlertTriangle className={`h-5 w-5 ${getRiskColor(predictiveMetrics?.complianceRiskScore || 0)}`} />
            </div>
            <Badge variant="outline" className="mt-2">
              Risk Assessment
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">
                  {predictiveMetrics?.performanceProjection.current.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(predictiveMetrics?.performanceProjection.trend || 'stable')}
            </div>
            <Badge variant="outline" className="mt-2">
              Current Score
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">
                  {predictiveMetrics?.resourceUtilization.current.toFixed(1)}%
                </p>
              </div>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="mt-2">
              Resource Usage
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth Forecast</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="utilization">Resource Planning</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Team Growth Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictiveMetrics?.teamGrowthForecast.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {predictiveMetrics?.teamGrowthForecast.anomalies && predictiveMetrics.teamGrowthForecast.anomalies.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Anomalies Detected:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {predictiveMetrics.teamGrowthForecast.anomalies.map((anomaly, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {anomaly}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictiveMetrics?.performanceProjection.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={80} stroke="red" strokeDasharray="5 5" label="Target" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Resource Utilization Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictiveMetrics?.resourceUtilization.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={85} stroke="orange" strokeDasharray="5 5" label="Optimal" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={{ fill: '#ffc658' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Risk Level</span>
                    <Badge 
                      variant={predictiveMetrics?.complianceRiskScore && predictiveMetrics.complianceRiskScore > 60 ? "destructive" : "secondary"}
                    >
                      {predictiveMetrics?.complianceRiskScore}% Risk
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (predictiveMetrics?.complianceRiskScore || 0) <= 30 
                          ? 'bg-green-500' 
                          : (predictiveMetrics?.complianceRiskScore || 0) <= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${predictiveMetrics?.complianceRiskScore || 0}%` }}
                    ></div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {(predictiveMetrics?.complianceRiskScore || 0) <= 30 && "Low risk - Continue current practices"}
                    {(predictiveMetrics?.complianceRiskScore || 0) > 30 && (predictiveMetrics?.complianceRiskScore || 0) <= 60 && "Medium risk - Monitor closely"}
                    {(predictiveMetrics?.complianceRiskScore || 0) > 60 && "High risk - Immediate action required"}
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
