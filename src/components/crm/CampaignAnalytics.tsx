import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Mail,
  Users,
  MousePointer,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';

interface CampaignAnalyticsProps {
  className?: string;
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ className }) => {
  // Fetch campaign performance summary
  const { data: performanceSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: EmailCampaignService.getCampaignPerformanceSummary
  });

  // Fetch all campaigns for detailed analytics
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['email-campaigns-analytics'],
    queryFn: () => EmailCampaignService.getEmailCampaigns({ status: 'sent' })
  });

  const isLoading = isLoadingSummary || isLoadingCampaigns;

  // Prepare chart data
  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.campaign_name.substring(0, 20) + (campaign.campaign_name.length > 20 ? '...' : ''),
    sent: campaign.total_recipients || 0,
    delivered: campaign.delivered_count || 0,
    opened: campaign.opened_count || 0,
    clicked: campaign.clicked_count || 0,
    open_rate: campaign.delivered_count ? ((campaign.opened_count || 0) / campaign.delivered_count) * 100 : 0,
    click_rate: campaign.opened_count ? ((campaign.clicked_count || 0) / campaign.opened_count) * 100 : 0,
    revenue: campaign.revenue_attributed || 0
  }));

  // Campaign type distribution
  const campaignTypeData = campaigns.reduce((acc, campaign) => {
    const type = campaign.campaign_type;
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
      existing.revenue += campaign.revenue_attributed || 0;
    } else {
      acc.push({
        name: type,
        value: 1,
        revenue: campaign.revenue_attributed || 0
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; revenue: number }>);

  // Calculate monthly performance trends from real campaign data
  const monthlyTrendData = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    // Group campaigns by month
    const monthlyData = campaigns.reduce((acc, campaign) => {
      if (!campaign.created_at) return acc;
      
      const date = new Date(campaign.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          campaigns: 0,
          total_sent: 0,
          total_delivered: 0,
          total_opened: 0,
          total_clicked: 0,
          total_revenue: 0
        };
      }
      
      acc[monthKey].campaigns += 1;
      acc[monthKey].total_sent += campaign.total_recipients || 0;
      acc[monthKey].total_delivered += campaign.delivered_count || 0;
      acc[monthKey].total_opened += campaign.opened_count || 0;
      acc[monthKey].total_clicked += campaign.clicked_count || 0;
      acc[monthKey].total_revenue += campaign.revenue_attributed || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate rates
    return Object.values(monthlyData).map((month: any) => ({
      month: month.month,
      campaigns: month.campaigns,
      open_rate: month.total_delivered > 0 ? (month.total_opened / month.total_delivered) * 100 : 0,
      click_rate: month.total_opened > 0 ? (month.total_clicked / month.total_opened) * 100 : 0,
      revenue: month.total_revenue
    })).sort((a: any, b: any) => {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
  }, [campaigns]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campaign Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive insights into your email marketing performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceSummary?.total_campaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active email campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(performanceSummary?.total_recipients || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails sent across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceSummary?.avg_open_rate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(performanceSummary?.total_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue attributed to campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Campaign Performance Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Campaign Performance Comparison</CardTitle>
                <CardDescription>
                  Sent, delivered, opened, and clicked metrics by campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                    <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                    <Bar dataKey="opened" fill="#ffc658" name="Opened" />
                    <Bar dataKey="clicked" fill="#ff7300" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Campaign Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Types</CardTitle>
                <CardDescription>Distribution by campaign type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={campaignTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {campaignTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
                <CardDescription>Based on open and click rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformanceData
                    .sort((a, b) => (b.open_rate + b.click_rate) - (a.open_rate + a.click_rate))
                    .slice(0, 5)
                    .map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {campaign.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {campaign.open_rate.toFixed(1)}% open
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {campaign.click_rate.toFixed(1)}% click
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(campaign.revenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(campaign.sent)} sent
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Engagement Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rates</CardTitle>
                <CardDescription>Open and click rates by campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="open_rate" fill="#8884d8" name="Open Rate %" />
                    <Bar dataKey="click_rate" fill="#82ca9d" name="Click Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Engagement</CardTitle>
                <CardDescription>Key engagement statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Open Rate</span>
                    <span className="text-sm">{(performanceSummary?.avg_open_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceSummary?.avg_open_rate || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Click Rate</span>
                    <span className="text-sm">{(performanceSummary?.avg_click_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceSummary?.avg_click_rate || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm">{(performanceSummary?.avg_conversion_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={performanceSummary?.avg_conversion_rate || 0} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Engagement</span>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatNumber(performanceSummary?.total_opened || 0)}</span>
                      <MousePointer className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-sm">{formatNumber(performanceSummary?.total_clicked || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue by Campaign */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue by Campaign</CardTitle>
                <CardDescription>Revenue attribution across campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Key revenue statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Revenue</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(performanceSummary?.total_revenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue per Campaign</span>
                  <span className="text-sm">
                    {formatCurrency((performanceSummary?.total_revenue || 0) / Math.max(performanceSummary?.total_campaigns || 1, 1))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenue per Recipient</span>
                  <span className="text-sm">
                    {formatCurrency((performanceSummary?.total_revenue || 0) / Math.max(performanceSummary?.total_recipients || 1, 1))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Campaign Type</CardTitle>
                <CardDescription>Revenue breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaignTypeData.map((type, index) => (
                    <div key={type.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize">{type.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(type.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>Campaign performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="open_rate"
                      stroke="#8884d8"
                      name="Open Rate %"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="click_rate"
                      stroke="#82ca9d"
                      name="Click Rate %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ffc658"
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No campaign trend data available. Create and send campaigns to see performance trends.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};