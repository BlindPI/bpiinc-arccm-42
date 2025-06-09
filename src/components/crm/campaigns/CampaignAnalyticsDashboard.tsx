
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users,
  Mail,
  BarChart3,
  PieChart,
  Globe
} from 'lucide-react';
import { CampaignManagementService } from '@/services/crm/campaignManagementService';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

export function CampaignAnalyticsDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data: campaigns } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const { data: roiData } = useQuery({
    queryKey: ['campaign-roi', selectedCampaign],
    queryFn: () => selectedCampaign !== 'all' 
      ? CampaignManagementService.getCampaignROI(selectedCampaign)
      : null,
    enabled: selectedCampaign !== 'all'
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ['campaign-performance'],
    queryFn: () => CampaignManagementService.getCampaignPerformanceMetrics()
  });

  const { data: geographicPerformance } = useQuery({
    queryKey: ['geographic-performance', selectedCampaign],
    queryFn: () => CampaignManagementService.getCampaignGeographicPerformance(
      selectedCampaign !== 'all' ? selectedCampaign : undefined
    )
  });

  const { data: industryPerformance } = useQuery({
    queryKey: ['industry-performance', selectedCampaign],
    queryFn: () => CampaignManagementService.getCampaignIndustryPerformance(
      selectedCampaign !== 'all' ? selectedCampaign : undefined
    )
  });

  const { data: abTests } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => CampaignManagementService.getABTestConfigs()
  });

  // Calculate aggregate metrics
  const aggregateMetrics = React.useMemo(() => {
    if (!campaigns) return null;

    const totalSent = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);
    const totalCost = campaigns.reduce((sum, c) => sum + (c.campaign_cost || 0), 0);

    return {
      totalSent,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      totalRevenue,
      totalROI: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
      activeCampaigns: campaigns.filter(c => c.status === 'sending').length
    };
  }, [campaigns]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Real-time campaign performance and ROI analysis
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns?.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics?.totalSent.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {aggregateMetrics?.activeCampaigns || 0} active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics?.openRate.toFixed(1) || 0}%</div>
            <Progress value={aggregateMetrics?.openRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics?.clickRate.toFixed(1) || 0}%</div>
            <Progress value={aggregateMetrics?.clickRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(aggregateMetrics?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From {campaigns?.length || 0} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics?.totalROI.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Open and click rates by campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaigns?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="campaign_name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey={(entry) => entry.delivered_count ? (entry.opened_count / entry.delivered_count) * 100 : 0}
                      name="Open Rate %"
                      fill="#3b82f6"
                    />
                    <Bar 
                      dataKey={(entry) => entry.opened_count ? (entry.clicked_count / entry.opened_count) * 100 : 0}
                      name="Click Rate %"
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Industry Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Performance</CardTitle>
                <CardDescription>Conversion rates by industry</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={industryPerformance?.slice(0, 5) || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="conversion_rate"
                      nameKey="industry_name"
                    >
                      {industryPerformance?.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Conversion Rate']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Performance
              </CardTitle>
              <CardDescription>Campaign performance by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicPerformance?.map((region, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{region.region_name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Sent: {region.total_sent}</span>
                        <span>Opens: {region.total_opened}</span>
                        <Badge variant="outline">
                          {region.total_sent ? ((region.total_opened / region.total_sent) * 100).toFixed(1) : 0}% Open Rate
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={region.total_sent ? (region.total_opened / region.total_sent) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                ))}
                
                {(!geographicPerformance || geographicPerformance.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No geographic data available</p>
                    <p className="text-sm">Send campaigns to see regional performance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
              <CardDescription>Active and completed A/B tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests?.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{test.test_name}</h4>
                      <Badge variant={test.is_active ? 'default' : 'secondary'}>
                        {test.is_active ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Variant A</h5>
                        <div className="text-2xl font-bold">
                          {test.variant_a_results?.conversion_rate || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {test.variant_a_results?.sample_size || 0} recipients
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Variant B</h5>
                        <div className="text-2xl font-bold">
                          {test.variant_b_results?.conversion_rate || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {test.variant_b_results?.sample_size || 0} recipients
                        </p>
                      </div>
                    </div>
                    
                    {test.statistical_significance && (
                      <div className="text-sm">
                        <Badge variant="success">
                          {test.statistical_significance}% confidence
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!abTests || abTests.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No A/B tests configured</p>
                    <p className="text-sm">Create tests to optimize campaign performance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          {selectedCampaign !== 'all' && roiData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(roiData.totalCost)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(roiData.revenueGenerated)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roiData.roi.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Per Lead</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(roiData.costPerLead)}</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a specific campaign to view detailed ROI analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
