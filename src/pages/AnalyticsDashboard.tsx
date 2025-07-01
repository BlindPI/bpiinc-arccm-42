import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Activity,
  PieChart,
  LineChart,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  Zap
} from 'lucide-react';
import { ExecutiveDashboard } from '@/components/crm/analytics/ExecutiveDashboard';
import { AdvancedRevenueAnalytics } from '@/components/crm/analytics/AdvancedRevenueAnalytics';
import { SalesPerformanceDashboard } from '@/components/crm/analytics/SalesPerformanceDashboard';

interface QuickStat {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const quickStats: QuickStat[] = [
    {
      title: 'Total Revenue',
      value: '$124.5K',
      change: 12.5,
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Accounts',
      value: '1,247',
      change: 8.2,
      changeType: 'increase',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: 3.1,
      changeType: 'increase',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'Pipeline Value',
      value: '$892K',
      change: -2.4,
      changeType: 'decrease',
      icon: Activity,
      color: 'text-orange-600'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
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
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stat.change)}%
                </span>
                <span className="ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly revenue performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Revenue trend visualization</p>
                    <p className="text-sm">Chart integration coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Sales Pipeline
                </CardTitle>
                <CardDescription>
                  Opportunities by stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: 'Prospect', value: 45, count: 12, color: 'bg-blue-500' },
                    { stage: 'Proposal', value: 30, count: 8, color: 'bg-green-500' },
                    { stage: 'Negotiation', value: 20, count: 5, color: 'bg-yellow-500' },
                    { stage: 'Closed Won', value: 5, count: 2, color: 'bg-purple-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium">{item.stage}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.value}%</div>
                        <div className="text-xs text-muted-foreground">{item.count} deals</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Sales team performance this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Johnson', revenue: 45000, deals: 8, badge: 'Top Performer' },
                    { name: 'Mike Chen', revenue: 38000, deals: 6, badge: 'Rising Star' },
                    { name: 'Emily Davis', revenue: 32000, deals: 7, badge: 'Consistent' }
                  ].map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">{performer.deals} deals closed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${(performer.revenue / 1000).toFixed(0)}K
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {performer.badge}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest CRM activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'New opportunity created', account: 'Acme Corp', time: '2 hours ago', type: 'opportunity' },
                    { action: 'Deal closed', account: 'TechStart Inc', time: '4 hours ago', type: 'success' },
                    { action: 'Follow-up scheduled', account: 'Global Solutions', time: '6 hours ago', type: 'task' },
                    { action: 'Proposal sent', account: 'Innovation Labs', time: '1 day ago', type: 'proposal' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.account} • {activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executive">
          <ExecutiveDashboard />
        </TabsContent>

        <TabsContent value="revenue">
          <AdvancedRevenueAnalytics />
        </TabsContent>

        <TabsContent value="sales">
          <SalesPerformanceDashboard />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Health Analytics</CardTitle>
              <CardDescription>
                Sales pipeline flow and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Pipeline Health Dashboard</h3>
                <p>Pipeline velocity, conversion rates, and bottleneck analysis</p>
                <p className="text-sm mt-2">Advanced pipeline analytics in development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                AI-powered insights and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Zap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">AI-Powered Insights</h3>
                <p>Machine learning predictions, lead scoring, and churn analysis</p>
                <p className="text-sm mt-2">Predictive features coming in Phase 6</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}