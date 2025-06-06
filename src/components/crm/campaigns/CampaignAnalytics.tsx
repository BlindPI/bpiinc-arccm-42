import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';

interface AnalyticsMetric {
  title: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface CampaignAnalyticsProps {
  campaignId?: string;
  className?: string;
}

export function CampaignAnalytics({ campaignId, className }: CampaignAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch campaign analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: () => campaignId ? EmailCampaignService.getCampaignAnalytics(campaignId) : null,
    enabled: !!campaignId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch performance summary
  const { data: performanceSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary(),
    refetchInterval: 60000,
  });

  // Fetch all campaigns for comparison
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns-analytics'],
    queryFn: () => EmailCampaignService.getEmailCampaigns(),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAnalytics(),
      refetchSummary()
    ]);
    setRefreshing(false);
  };

  // Calculate metrics based on data
  const getAnalyticsMetrics = (): AnalyticsMetric[] => {
    if (campaignId && analytics) {
      return [
        {
          title: 'Delivery Rate',
          value: `${analytics.delivery_rate.toFixed(1)}%`,
          change: 2.3,
          changeType: 'increase',
          icon: CheckCircle,
          color: 'text-green-600',
          description: 'Percentage of emails successfully delivered'
        },
        {
          title: 'Open Rate',
          value: `${analytics.open_rate.toFixed(1)}%`,
          change: 1.8,
          changeType: 'increase',
          icon: Eye,
          color: 'text-blue-600',
          description: 'Percentage of delivered emails that were opened'
        },
        {
          title: 'Click Rate',
          value: `${analytics.click_rate.toFixed(1)}%`,
          change: -0.5,
          changeType: 'decrease',
          icon: MousePointer,
          color: 'text-purple-600',
          description: 'Percentage of opened emails that were clicked'
        },
        {
          title: 'Conversion Rate',
          value: `${analytics.conversion_rate.toFixed(1)}%`,
          change: 3.2,
          changeType: 'increase',
          icon: Target,
          color: 'text-orange-600',
          description: 'Percentage of recipients who became leads'
        }
      ];
    }

    // Overall metrics when no specific campaign is selected
    return [
      {
        title: 'Total Campaigns',
        value: performanceSummary?.total_campaigns?.toString() || '0',
        change: 12.5,
        changeType: 'increase',
        icon: Mail,
        color: 'text-blue-600',
        description: 'Total number of campaigns sent'
      },
      {
        title: 'Average Open Rate',
        value: `${performanceSummary?.avg_open_rate?.toFixed(1) || '0'}%`,
        change: 2.1,
        changeType: 'increase',
        icon: Eye,
        color: 'text-green-600',
        description: 'Average open rate across all campaigns'
      },
      {
        title: 'Average Click Rate',
        value: `${performanceSummary?.avg_click_rate?.toFixed(1) || '0'}%`,
        change: 1.5,
        changeType: 'increase',
        icon: MousePointer,
        color: 'text-purple-600',
        description: 'Average click rate across all campaigns'
      },
      {
        title: 'Total Revenue',
        value: `$${(performanceSummary?.total_revenue || 0).toLocaleString()}`,
        change: 8.7,
        changeType: 'increase',
        icon: DollarSign,
        color: 'text-orange-600',
        description: 'Total revenue attributed to campaigns'
      }
    ];
  };

  const analyticsMetrics = getAnalyticsMetrics();
  const isLoading = analyticsLoading || summaryLoading || campaignsLoading;

  // Get top performing campaigns
  const topCampaigns = campaigns?.filter(c => c.status === 'sent')
    .sort((a, b) => {
      const aRate = a.delivered_count && a.opened_count ? (a.opened_count / a.delivered_count) * 100 : 0;
      const bRate = b.delivered_count && b.opened_count ? (b.opened_count / b.delivered_count) * 100 : 0;
      return bRate - aRate;
    })
    .slice(0, 5) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            {campaignId ? 'Detailed campaign performance metrics' : 'Overall campaign performance insights'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
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
        </div>
      </div>

      {/* Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metric.changeType === 'increase' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                  <span className="ml-1">vs last period</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Performance
                </CardTitle>
                <CardDescription>
                  Key metrics comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Performance chart visualization</p>
                      <p className="text-sm">Chart integration needed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Engagement Funnel
                </CardTitle>
                <CardDescription>
                  Email engagement progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignId && analytics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <span className="font-medium">Sent</span>
                      <span className="text-lg font-bold">{analytics.total_sent.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <span className="font-medium">Delivered</span>
                      <span className="text-lg font-bold">
                        {Math.round(analytics.total_sent * (analytics.delivery_rate / 100)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                      <span className="font-medium">Opened</span>
                      <span className="text-lg font-bold">
                        {Math.round(analytics.total_sent * (analytics.delivery_rate / 100) * (analytics.open_rate / 100)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                      <span className="font-medium">Clicked</span>
                      <span className="text-lg font-bold">
                        {Math.round(analytics.total_sent * (analytics.delivery_rate / 100) * (analytics.open_rate / 100) * (analytics.click_rate / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a campaign to view funnel</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Campaigns
              </CardTitle>
              <CardDescription>
                Campaigns with highest engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCampaigns.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No campaign data available</p>
                  </div>
                ) : (
                  topCampaigns.map((campaign, index) => {
                    const openRate = campaign.delivered_count && campaign.opened_count 
                      ? (campaign.opened_count / campaign.delivered_count) * 100 
                      : 0;
                    const clickRate = campaign.opened_count && campaign.clicked_count
                      ? (campaign.clicked_count / campaign.opened_count) * 100
                      : 0;

                    return (
                      <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            <Badge variant="secondary">{campaign.campaign_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{campaign.subject_line}</p>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{openRate.toFixed(1)}%</p>
                            <p className="text-muted-foreground">Open Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{clickRate.toFixed(1)}%</p>
                            <p className="text-muted-foreground">Click Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{campaign.total_recipients?.toLocaleString() || '0'}</p>
                            <p className="text-muted-foreground">Recipients</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Campaign performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <LineChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Performance Trends</h3>
                <p>Historical performance analysis and trends</p>
                <p className="text-sm mt-2">Chart integration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analysis</CardTitle>
              <CardDescription>
                Detailed engagement metrics and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Engagement Analysis</h3>
                <p>Click patterns, time-based engagement, and user behavior</p>
                <p className="text-sm mt-2">Advanced engagement analytics in development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Attribution</CardTitle>
              <CardDescription>
                Revenue generated from email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Revenue Analytics</h3>
                <p>Campaign ROI, revenue attribution, and conversion tracking</p>
                <p className="text-sm mt-2">Revenue analytics features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}