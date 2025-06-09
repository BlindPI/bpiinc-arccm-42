import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Cell, Pie } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { CampaignManagementService } from '@/services/crm/campaignManagementService';

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  total_recipients: number;
  opens: number;
  clicks: number;
  conversions: number;
  roi: number;
}

interface PerformanceMetric {
  campaign_id: string;
  opens: number;
  clicks: number;
  conversions: number;
  roi: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function CampaignAnalyticsDashboard() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => CampaignManagementService.getEmailCampaigns?.() || Promise.resolve([])
  });

  const { data: performanceMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['campaign-performance'],
    queryFn: () => CampaignManagementService.getCampaignPerformanceMetrics?.() || Promise.resolve([])
  });

  const mockEngagementData = [
    { name: 'Opened', value: 65, count: 1300 },
    { name: 'Clicked', value: 35, count: 700 },
    { name: 'Converted', value: 15, count: 300 },
    { name: 'Unsubscribed', value: 5, count: 100 }
  ];

  const mockChannelData = [
    { channel: 'Email', campaigns: 15, engagement: 68 },
    { channel: 'Social Media', campaigns: 8, engagement: 45 },
    { channel: 'Direct Mail', campaigns: 3, engagement: 32 },
    { channel: 'SMS', campaigns: 5, engagement: 78 }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">350%</div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChannelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Email Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockEngagementData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {mockEngagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
