
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CampaignMetrics {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  sentDate?: string;
  scheduledDate?: string;
  totalRecipients: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  leadsGenerated: number;
  revenueAttributed: number;
  cost: number;
}

export const CampaignAnalytics: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCampaignType, setSelectedCampaignType] = useState('all');

  // Mock data - replace with actual API call
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaign-analytics', selectedTimeframe, selectedCampaignType],
    queryFn: async (): Promise<CampaignMetrics[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [
        {
          id: '1',
          name: 'Q4 Product Launch Campaign',
          type: 'product_launch',
          status: 'completed',
          sentDate: '2024-11-15T10:00:00Z',
          totalRecipients: 5000,
          deliveredCount: 4850,
          openedCount: 1455,
          clickedCount: 291,
          bouncedCount: 150,
          unsubscribedCount: 45,
          leadsGenerated: 67,
          revenueAttributed: 45000,
          cost: 2500
        },
        {
          id: '2',
          name: 'Winter Training Newsletter',
          type: 'newsletter',
          status: 'completed',
          sentDate: '2024-12-01T09:00:00Z',
          totalRecipients: 3200,
          deliveredCount: 3100,
          openedCount: 1240,
          clickedCount: 186,
          bouncedCount: 100,
          unsubscribedCount: 12,
          leadsGenerated: 23,
          revenueAttributed: 18500,
          cost: 800
        },
        {
          id: '3',
          name: 'New Year Safety Course Promo',
          type: 'promotional',
          status: 'active',
          sentDate: '2024-12-20T08:00:00Z',
          totalRecipients: 2800,
          deliveredCount: 2720,
          openedCount: 950,
          clickedCount: 142,
          bouncedCount: 80,
          unsubscribedCount: 8,
          leadsGenerated: 34,
          revenueAttributed: 28000,
          cost: 1200
        },
        {
          id: '4',
          name: 'Customer Retention Campaign',
          type: 'retention',
          status: 'scheduled',
          scheduledDate: '2025-01-05T10:00:00Z',
          totalRecipients: 1500,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          bouncedCount: 0,
          unsubscribedCount: 0,
          leadsGenerated: 0,
          revenueAttributed: 0,
          cost: 600
        }
      ];
    }
  });

  const calculateMetrics = (campaigns: CampaignMetrics[]) => {
    const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'active');
    
    const totals = completedCampaigns.reduce((acc, campaign) => ({
      totalRecipients: acc.totalRecipients + campaign.totalRecipients,
      deliveredCount: acc.deliveredCount + campaign.deliveredCount,
      openedCount: acc.openedCount + campaign.openedCount,
      clickedCount: acc.clickedCount + campaign.clickedCount,
      bouncedCount: acc.bouncedCount + campaign.bouncedCount,
      unsubscribedCount: acc.unsubscribedCount + campaign.unsubscribedCount,
      leadsGenerated: acc.leadsGenerated + campaign.leadsGenerated,
      revenueAttributed: acc.revenueAttributed + campaign.revenueAttributed,
      totalCost: acc.totalCost + campaign.cost
    }), {
      totalRecipients: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
      unsubscribedCount: 0,
      leadsGenerated: 0,
      revenueAttributed: 0,
      totalCost: 0
    });

    return {
      ...totals,
      deliveryRate: totals.totalRecipients > 0 ? (totals.deliveredCount / totals.totalRecipients) * 100 : 0,
      openRate: totals.deliveredCount > 0 ? (totals.openedCount / totals.deliveredCount) * 100 : 0,
      clickRate: totals.deliveredCount > 0 ? (totals.clickedCount / totals.deliveredCount) * 100 : 0,
      clickThroughRate: totals.openedCount > 0 ? (totals.clickedCount / totals.openedCount) * 100 : 0,
      bounceRate: totals.totalRecipients > 0 ? (totals.bouncedCount / totals.totalRecipients) * 100 : 0,
      unsubscribeRate: totals.deliveredCount > 0 ? (totals.unsubscribedCount / totals.deliveredCount) * 100 : 0,
      conversionRate: totals.clickedCount > 0 ? (totals.leadsGenerated / totals.clickedCount) * 100 : 0,
      roi: totals.totalCost > 0 ? ((totals.revenueAttributed - totals.totalCost) / totals.totalCost) * 100 : 0,
      costPerLead: totals.leadsGenerated > 0 ? totals.totalCost / totals.leadsGenerated : 0,
      revenuePerRecipient: totals.totalRecipients > 0 ? totals.revenueAttributed / totals.totalRecipients : 0
    };
  };

  const getCampaignStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = campaigns ? calculateMetrics(campaigns) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Email marketing performance and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="product_launch">Product Launch</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRecipients.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Delivery rate: {metrics.deliveryRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.openedCount.toLocaleString()} opens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.clickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.clickedCount.toLocaleString()} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.revenueAttributed)}</div>
              <p className="text-xs text-muted-foreground">
                ROI: {typeof metrics.roi === 'number' ? metrics.roi.toFixed(1) : '0'}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.leadsGenerated}</div>
              <p className="text-xs text-muted-foreground">
                Conversion: {metrics.conversionRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.costPerLead)}</div>
              <p className="text-xs text-muted-foreground">
                Total cost: {formatCurrency(metrics.totalCost)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bounceRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.bouncedCount} bounces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.unsubscribeRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.unsubscribedCount} unsubscribes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Details */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Individual Campaigns</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Detailed metrics for each email campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns?.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCampaignStatusIcon(campaign.status)}
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {campaign.sentDate 
                              ? `Sent ${new Date(campaign.sentDate).toLocaleDateString()}`
                              : campaign.scheduledDate 
                                ? `Scheduled for ${new Date(campaign.scheduledDate).toLocaleDateString()}`
                                : 'Draft'
                            }
                          </p>
                        </div>
                      </div>
                      {getCampaignStatusBadge(campaign.status)}
                    </div>

                    {campaign.status !== 'draft' && campaign.status !== 'scheduled' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Recipients</div>
                          <div className="font-medium">{campaign.totalRecipients.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Opens</div>
                          <div className="font-medium">
                            {campaign.openedCount.toLocaleString()} ({campaign.deliveredCount > 0 ? ((campaign.openedCount / campaign.deliveredCount) * 100).toFixed(1) : 0}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clicks</div>
                          <div className="font-medium">
                            {campaign.clickedCount.toLocaleString()} ({campaign.deliveredCount > 0 ? ((campaign.clickedCount / campaign.deliveredCount) * 100).toFixed(1) : 0}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Leads</div>
                          <div className="font-medium">{campaign.leadsGenerated}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue</div>
                          <div className="font-medium">{formatCurrency(campaign.revenueAttributed)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">ROI</div>
                          <div className="font-medium">
                            {campaign.cost > 0 ? (((campaign.revenueAttributed - campaign.cost) / campaign.cost) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Campaign performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Trend Analysis</h3>
                  <p>Interactive charts coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Recommendations to improve campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-blue-700">Optimization Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    Your click-through rate is 23% above industry average. Consider A/B testing subject lines to further improve open rates.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700">Strong Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Your product launch campaigns show 34% higher conversion rates than newsletter campaigns. Consider more targeted promotional content.
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-yellow-700">Attention Needed</h4>
                  <p className="text-sm text-muted-foreground">
                    Bounce rate has increased by 12% over the last month. Consider list cleaning and email validation tools.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalytics;
