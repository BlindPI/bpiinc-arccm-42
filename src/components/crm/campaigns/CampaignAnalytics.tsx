import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import { crmEmailCampaignService } from '@/services/crm/crmEmailCampaignService';
import type { CRMEmailCampaign, CampaignMetrics } from '@/types/crm';

interface CampaignAnalyticsProps {
  campaignId?: string;
  showSummary?: boolean;
}

export function CampaignAnalytics({ campaignId, showSummary = false }: CampaignAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30');
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId || '');

  // Fetch campaigns for dropdown
  const { data: campaignsData } = useQuery({
    queryKey: ['crm', 'campaigns'],
    queryFn: async () => {
      const result = await crmEmailCampaignService.getCampaigns({}, 1, 100);
      return result.success ? result.data : { data: [], total: 0 };
    },
  });

  // Fetch campaign summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['crm', 'campaign-summary', dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const result = await crmEmailCampaignService.getCampaignSummary(
        startDate.toISOString(),
        endDate.toISOString()
      );
      return result.success ? result.data : null;
    },
    enabled: showSummary,
  });

  // Fetch specific campaign metrics
  const { data: campaignMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['crm', 'campaign-metrics', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const result = await crmEmailCampaignService.getCampaignMetrics(selectedCampaign);
      return result.success ? result.data : null;
    },
    enabled: !!selectedCampaign,
  });

  // Fetch campaign details
  const { data: campaignDetails } = useQuery({
    queryKey: ['crm', 'campaign', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const result = await crmEmailCampaignService.getCampaign(selectedCampaign);
      return result.success ? result.data : null;
    },
    enabled: !!selectedCampaign,
  });

  const campaigns = campaignsData?.data || [];

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      scheduled: Calendar,
      sent: CheckCircle,
      failed: AlertCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (showSummary) {
    if (summaryLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaign Analytics</h2>
            <p className="text-gray-600">Overview of email campaign performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{summaryData.total_campaigns}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">{summaryData.total_recipients.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(summaryData.avg_open_rate)}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.total_revenue_attributed)}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaign Types Breakdown */}
        {summaryData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Campaigns by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(summaryData.campaigns_by_type).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 10).map((campaign) => {
                  const openRate = campaign.total_recipients > 0 ? (campaign.opened_count / campaign.total_recipients) * 100 : 0;
                  const clickRate = campaign.opened_count > 0 ? (campaign.clicked_count / campaign.opened_count) * 100 : 0;
                  
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        <span className="capitalize">{campaign.campaign_type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.total_recipients.toLocaleString()}</TableCell>
                      <TableCell>{formatPercentage(openRate)}</TableCell>
                      <TableCell>{formatPercentage(clickRate)}</TableCell>
                      <TableCell>{formatCurrency(campaign.revenue_attributed)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Individual Campaign Analytics
  return (
    <div className="space-y-6">
      {/* Campaign Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Campaign
              </label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.campaign_name} - {campaign.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && campaignDetails && (
        <>
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {campaignDetails.campaign_name}
                  </CardTitle>
                  <CardDescription>
                    {campaignDetails.campaign_type.replace('_', ' ')} campaign • {campaignDetails.target_audience}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(campaignDetails.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(campaignDetails.status)}
                    {campaignDetails.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Subject Line</p>
                  <p className="text-gray-900">{campaignDetails.subject_line}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sent Date</p>
                  <p className="text-gray-900">
                    {campaignDetails.sent_date 
                      ? new Date(campaignDetails.sent_date).toLocaleDateString()
                      : 'Not sent'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Recipients</p>
                  <p className="text-gray-900">{campaignDetails.total_recipients.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {campaignMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPercentage(campaignMetrics.open_rate)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaignDetails.opened_count} of {campaignDetails.total_recipients} opened
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Click Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPercentage(campaignMetrics.click_rate)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaignDetails.clicked_count} clicks
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <MousePointer className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPercentage(campaignMetrics.conversion_rate)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaignMetrics.leads_generated} leads generated
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">ROI</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPercentage(campaignMetrics.roi)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(campaignMetrics.revenue_attributed)} revenue
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Delivery Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivered</span>
                    <span className="font-medium">{campaignDetails.delivered_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bounced</span>
                    <span className="font-medium text-red-600">{campaignDetails.bounced_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unsubscribed</span>
                    <span className="font-medium text-orange-600">{campaignDetails.unsubscribed_count.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-medium">
                    <span>Delivery Rate</span>
                    <span>
                      {campaignDetails.total_recipients > 0 
                        ? formatPercentage((campaignDetails.delivered_count / campaignDetails.total_recipients) * 100)
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Business Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Leads Generated</span>
                    <span className="font-medium">{campaignDetails.leads_generated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Opportunities Created</span>
                    <span className="font-medium">{campaignDetails.opportunities_created.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue Attributed</span>
                    <span className="font-medium text-green-600">{formatCurrency(campaignDetails.revenue_attributed)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-medium">
                    <span>Cost per Lead</span>
                    <span>
                      {campaignDetails.leads_generated > 0 
                        ? formatCurrency(100 / campaignDetails.leads_generated) // Assuming $100 campaign cost
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!selectedCampaign && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Campaign</h3>
            <p className="text-gray-600">
              Choose a campaign from the dropdown above to view detailed analytics
            </p>
          </CardContent>
        </Card>
      )}

      {metricsLoading && selectedCampaign && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}