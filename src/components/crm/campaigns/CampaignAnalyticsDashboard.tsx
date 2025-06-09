
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Users, 
  DollarSign,
  Target,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { CampaignManagementService } from '@/services/crm/campaignManagementService';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function CampaignAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const { data: performanceMetrics = [] } = useQuery({
    queryKey: ['campaign-performance'],
    queryFn: () => CampaignManagementService.getCampaignPerformanceMetrics()
  });

  const { data: abTestConfigs = [] } = useQuery({
    queryKey: ['ab-test-configs'],
    queryFn: () => CampaignManagementService.getABTestConfigs()
  });

  const { data: geographicPerformance = [] } = useQuery({
    queryKey: ['campaign-geographic-performance'],
    queryFn: () => CampaignManagementService.getCampaignGeographicPerformance()
  });

  const { data: industryPerformance = [] } = useQuery({
    queryKey: ['campaign-industry-performance'],
    queryFn: () => CampaignManagementService.getCampaignIndustryPerformance()
  });

  // Calculate overall metrics
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending').length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
  const averageOpenRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + ((c.opened_count || 0) / Math.max(c.delivered_count || 1, 1)), 0) / campaigns.length * 100 
    : 0;

  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);
  const totalCost = campaigns.reduce((sum, c) => sum + (0), 0); // campaign_cost property missing, defaulting to 0

  // Prepare chart data
  const campaignTrendData = campaigns.slice(0, 10).map(campaign => ({
    name: campaign.campaign_name.length > 15 
      ? campaign.campaign_name.substring(0, 15) + '...' 
      : campaign.campaign_name,
    recipients: campaign.total_recipients || 0,
    opened: campaign.opened_count || 0,
    clicked: campaign.clicked_count || 0,
    openRate: campaign.delivered_count ? ((campaign.opened_count || 0) / campaign.delivered_count * 100) : 0,
    clickRate: campaign.opened_count ? ((campaign.clicked_count || 0) / campaign.opened_count * 100) : 0
  }));

  const campaignTypeData = campaigns.reduce((acc, campaign) => {
    const type = campaign.campaign_type || 'email';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const handleExportData = async () => {
    try {
      const csvData = await EmailCampaignService.exportCampaignData();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Campaign data exported successfully');
    } catch (error) {
      toast.error('Failed to export campaign data');
    }
  };

  if (campaignsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Track performance metrics and ROI across all marketing campaigns
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{activeCampaigns} active</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Emails sent across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Industry average: 21.3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Attribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue attributed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Campaign Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Trends</CardTitle>
              <CardDescription>
                Email engagement metrics across recent campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="recipients" fill="#8884d8" name="Recipients" />
                  <Bar dataKey="opened" fill="#82ca9d" name="Opened" />
                  <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Types Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Types</CardTitle>
                <CardDescription>Distribution by campaign type</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={campaignTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {campaignTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaign data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest campaign performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <p className="text-sm text-gray-500">
                          {campaign.total_recipients} recipients
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' : 
                          campaign.status === 'sending' ? 'secondary' : 
                          'outline'
                        }>
                          {campaign.status}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {campaign.delivered_count ? 
                            `${((campaign.opened_count || 0) / campaign.delivered_count * 100).toFixed(1)}% open` :
                            '0% open'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Rate Trends</CardTitle>
              <CardDescription>
                Open and click rates over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={campaignTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="openRate" 
                    stroke="#8884d8" 
                    name="Open Rate %" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clickRate" 
                    stroke="#82ca9d" 
                    name="Click Rate %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Performance</CardTitle>
                <CardDescription>Campaign performance by location</CardDescription>
              </CardHeader>
              <CardContent>
                {geographicPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {geographicPerformance.slice(0, 5).map((location, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{location.location || 'Unknown'}</span>
                          <span className="text-sm text-gray-500">
                            {location.conversion_rate}% conversion
                          </span>
                        </div>
                        <Progress value={location.conversion_rate || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Performance</CardTitle>
                <CardDescription>Campaign performance by industry sector</CardDescription>
              </CardHeader>
              <CardContent>
                {industryPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {industryPerformance.slice(0, 5).map((industry, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{industry.industry || 'Unknown'}</span>
                          <span className="text-sm text-gray-500">
                            {industry.conversion_rate}% conversion
                          </span>
                        </div>
                        <Progress value={industry.conversion_rate || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No industry data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
              <CardDescription>
                Active and completed A/B test configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {abTestConfigs.length > 0 ? (
                <div className="space-y-4">
                  {abTestConfigs.map((test) => (
                    <div key={test.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{test.test_name}</h4>
                        <Badge variant={test.is_active ? "default" : "secondary"}>
                          {test.is_active ? "Active" : "Completed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Testing: {test.variable_tested}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Variant A:</span>
                          <p className="text-gray-500">Control group</p>
                        </div>
                        <div>
                          <span className="font-medium">Variant B:</span>
                          <p className="text-gray-500">Test variation</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No A/B tests configured</p>
                  <p className="text-sm">Create A/B tests to optimize campaign performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Attribution</CardTitle>
                <CardDescription>Revenue generated by campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <p className="text-sm text-gray-500">Total attributed revenue</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cost per Lead</span>
                      <span>{formatCurrency(totalCost > 0 ? totalCost / Math.max(campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0), 1) : 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span>{totalRecipients > 0 ? ((campaigns.reduce((sum, c) => sum + (c.opportunities_created || 0), 0) / totalRecipients) * 100).toFixed(2) : 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI</span>
                      <span className="text-green-600 font-medium">
                        {totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign ROI Breakdown</CardTitle>
                <CardDescription>Individual campaign performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{campaign.campaign_name}</span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(campaign.revenue_attributed || 0)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.leads_generated || 0} leads • {campaign.opportunities_created || 0} opportunities
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
