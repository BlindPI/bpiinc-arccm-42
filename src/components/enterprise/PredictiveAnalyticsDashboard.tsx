
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Download,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export function PredictiveAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('performance');
  const [timeHorizon, setTimeHorizon] = useState('30days');
  const [confidence, setConfidence] = useState('high');

  // Mock predictive analytics data
  const performancePredictions = [
    { month: 'Jul', actual: 88, predicted: 91, confidence: 'high' },
    { month: 'Aug', actual: 92, predicted: 94, confidence: 'high' },
    { month: 'Sep', actual: null, predicted: 96, confidence: 'high' },
    { month: 'Oct', actual: null, predicted: 97, confidence: 'medium' },
    { month: 'Nov', actual: null, predicted: 95, confidence: 'medium' },
    { month: 'Dec', actual: null, predicted: 98, confidence: 'low' }
  ];

  const riskAssessments = [
    {
      category: 'Team Burnout',
      risk: 'medium',
      probability: 35,
      impact: 'high',
      timeline: '6-8 weeks',
      mitigation: 'Increase team rotation, reduce workload by 15%'
    },
    {
      category: 'Resource Shortage',
      risk: 'low',
      probability: 15,
      impact: 'medium',
      timeline: '3-4 months',
      mitigation: 'Proactive hiring in Q4, cross-training initiatives'
    },
    {
      category: 'Performance Decline',
      risk: 'low',
      probability: 12,
      impact: 'high',
      timeline: '2-3 months',
      mitigation: 'Enhanced monitoring, skill development programs'
    }
  ];

  const capacityForecasts = [
    { location: 'New York', current: 75, forecast_30: 82, forecast_60: 87, forecast_90: 89 },
    { location: 'Chicago', current: 80, forecast_30: 85, forecast_60: 88, forecast_90: 92 },
    { location: 'Los Angeles', current: 72, forecast_30: 76, forecast_60: 79, forecast_90: 83 },
    { location: 'Miami', current: 68, forecast_30: 72, forecast_60: 76, forecast_90: 80 },
    { location: 'Seattle', current: 78, forecast_30: 81, forecast_60: 84, forecast_90: 87 }
  ];

  const mlInsights = [
    {
      type: 'trend',
      title: 'Cross-location collaboration increasing',
      description: 'AI models predict 25% increase in cross-location projects over next quarter',
      confidence: 92,
      actionable: true
    },
    {
      type: 'optimization',
      title: 'Resource allocation opportunity',
      description: 'Redistribute 3 teams from Chicago to New York for optimal performance',
      confidence: 87,
      actionable: true
    },
    {
      type: 'risk',
      title: 'Potential skill gap emerging',
      description: 'Advanced certification needs predicted to increase 40% in Q4',
      confidence: 78,
      actionable: true
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-blue-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Predictive Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered insights and forecasting for enterprise team management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeHorizon} onValueChange={setTimeHorizon}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="60days">60 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={confidence} onValueChange={setConfidence}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High Confidence</SelectItem>
              <SelectItem value="medium">Medium Confidence</SelectItem>
              <SelectItem value="all">All Predictions</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Predictions Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+6%</div>
            <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goal Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-gray-500 mt-1">Predicted success rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">87%</div>
            <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Low</div>
            <p className="text-xs text-gray-500 mt-1">Overall assessment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="insights">ML Insights</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Performance Predictions vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performancePredictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Actual Performance" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name="Predicted Performance" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Capacity Forecasting by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={capacityForecasts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#8884d8" name="Current" />
                  <Bar dataKey="forecast_30" fill="#82ca9d" name="30 Days" />
                  <Bar dataKey="forecast_60" fill="#ffc658" name="60 Days" />
                  <Bar dataKey="forecast_90" fill="#ff7300" name="90 Days" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAssessments.map((risk, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{risk.category}</span>
                        <Badge className={getRiskColor(risk.risk)}>
                          {risk.risk} risk
                        </Badge>
                        <Badge variant="outline">
                          {risk.probability}% probability
                        </Badge>
                      </div>
                      <Badge variant="secondary">{risk.timeline}</Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Impact:</strong> {risk.impact}
                    </div>
                    
                    <div className="text-sm">
                      <strong>Mitigation Strategy:</strong> {risk.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Machine Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {insight.type === 'optimization' && <Target className="h-4 w-4 text-green-500" />}
                        {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <span className="font-medium">{insight.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {insight.confidence}% confidence
                        </span>
                        {insight.actionable && (
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Planning & What-If Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Scenario Modeling</h3>
                <p>Advanced what-if analysis and scenario planning tools</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
