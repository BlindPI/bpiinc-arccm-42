
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';

interface CampaignAnalyticsProps {
  campaignId?: string;
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ campaignId }) => {
  const { data: performanceSummary, isLoading } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary()
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            Loading analytics data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create chart data with proper type handling
  const chartData = [
    {
      name: 'Total Campaigns',
      value: performanceSummary?.total_campaigns || 0,
      label: 'Campaigns'
    },
    {
      name: 'Total Recipients',
      value: performanceSummary?.total_recipients || 0,
      label: 'Recipients'
    },
    {
      name: 'Total Delivered',
      value: performanceSummary?.total_delivered || 0,
      label: 'Delivered'
    },
    {
      name: 'Total Opened',
      value: performanceSummary?.total_opened || 0,
      label: 'Opened'
    }
  ];

  const formatTooltipValue = (value: any, name: string) => {
    const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
    if (String(name).includes('Rate')) {
      return `${numValue.toFixed(1)}%`;
    }
    return numValue.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Overview</CardTitle>
          <CardDescription>
            Summary of email campaign performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [formatTooltipValue(value, String(name)), String(name)]}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceSummary?.avg_open_rate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(performanceSummary?.avg_click_rate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(performanceSummary?.total_revenue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
