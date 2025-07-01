import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, Users, Award, Building2, Calendar, 
  AlertTriangle, CheckCircle, BarChart3, Target,
  ArrowUpRight, ArrowDownRight, Minus, Plus, Settings
} from 'lucide-react';
import { ContextualHelp } from '../help/ContextualHelp';
import type { AuthorizedProvider } from '@/types/provider-management';

interface KPIMetric {
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  format?: 'number' | 'percentage' | 'currency';
}

interface EnterpriseProviderDashboardProps {
  provider: AuthorizedProvider;
}

export function EnterpriseProviderDashboard({ provider }: EnterpriseProviderDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const kpiMetrics: KPIMetric[] = [
    {
      label: 'Active Instructors',
      value: 24,
      previousValue: 22,
      trend: 'up',
      target: 30,
      format: 'number'
    },
    {
      label: 'Training Sessions',
      value: 156,
      previousValue: 142,
      trend: 'up',
      format: 'number'
    },
    {
      label: 'Completion Rate',
      value: 94.2,
      previousValue: 91.8,
      trend: 'up',
      target: 95,
      format: 'percentage'
    },
    {
      label: 'Compliance Score',
      value: provider.compliance_score || 88.5,
      previousValue: 86.2,
      trend: 'up',
      target: 90,
      format: 'percentage'
    }
  ];

  // Get location name - this would need to be fetched or passed as part of provider data
  const locationName = provider.primary_location_id ? 'Assigned Location' : 'No location assigned';

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: string | number, format?: string) => {
    if (format === 'percentage') return `${value}%`;
    if (format === 'currency') return `$${value}`;
    return value.toString();
  };

  const quickActions = [
    { label: 'Create Team', icon: Users, color: 'blue' },
    { label: 'Schedule Training', icon: Calendar, color: 'green' },
    { label: 'Generate Report', icon: BarChart3, color: 'purple' },
    { label: 'Manage Compliance', icon: CheckCircle, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section - Salesforce Style */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{provider.name}</h1>
              <p className="text-blue-100">
                {provider.provider_type.replace('_', ' ')} • {locationName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ContextualHelp 
              context="provider_dashboard"
              trigger={
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Need Help?
                </Button>
              }
            />
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((metric, index) => (
            <Card key={index} className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">{metric.label}</p>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatValue(metric.value, metric.format)}
                  </span>
                  {metric.previousValue && (
                    <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                      {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                      {Math.abs(Number(metric.value) - Number(metric.previousValue)).toFixed(1)}
                    </span>
                  )}
                </div>
                {metric.target && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Target: {formatValue(metric.target, metric.format)}</span>
                      <span>{Math.round((Number(metric.value) / metric.target) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(Number(metric.value) / metric.target) * 100} 
                      className="h-1 bg-white/20"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions - Salesforce Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex-col gap-2 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${action.color}-100`}>
                    <IconComponent className={`h-5 w-5 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time Period:</span>
            <Button 
              variant={selectedTimeframe === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedTimeframe('7d')}
            >
              7 Days
            </Button>
            <Button 
              variant={selectedTimeframe === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedTimeframe('30d')}
            >
              30 Days
            </Button>
            <Button 
              variant={selectedTimeframe === '90d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedTimeframe('90d')}
            >
              90 Days
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Team "Alpha Squad" created</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 training sessions scheduled</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">2 certifications expiring soon</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Rating</span>
                      <span className="text-sm">{provider.performance_rating.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(provider.performance_rating / 5) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Training Quality</span>
                      <span className="text-sm">4.7/5.0</span>
                    </div>
                    <Progress value={94} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Resource Utilization</span>
                      <span className="text-sm">87%</span>
                    </div>
                    <Progress value={87} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Team Management</h3>
            <p>Detailed team management interface will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
            <p>Comprehensive performance charts and metrics will be shown here</p>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Compliance Dashboard</h3>
            <p>Compliance tracking and certification management interface</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
