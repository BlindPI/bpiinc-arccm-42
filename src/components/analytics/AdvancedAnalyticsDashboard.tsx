
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Activity,
  Brain,
  Workflow,
  Settings
} from 'lucide-react';
import { PredictiveAnalyticsDashboard } from './PredictiveAnalyticsDashboard';
import { WorkflowApprovalDashboard } from '@/components/governance/WorkflowApprovalDashboard';

export function AdvancedAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('predictive');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered insights, predictive analytics, and governance workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Analytics Models</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="mt-2">Active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predictions</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Badge variant="outline" className="mt-2">30-day forecast</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workflow Accuracy</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <Workflow className="h-5 w-5 text-purple-600" />
            </div>
            <Badge variant="outline" className="mt-2">High confidence</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Quality</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <Badge variant="outline" className="mt-2">Excellent</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictive">
          <PredictiveAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="governance">
          <WorkflowApprovalDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced insights coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
