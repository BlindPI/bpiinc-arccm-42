
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CampaignPerformanceChart() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  // Transform campaign data for the chart
  const chartData = campaigns
    .slice(0, 5) // Show last 5 campaigns
    .map(campaign => ({
      name: campaign.campaign_name?.slice(0, 15) + '...' || 'Unnamed',
      sent: campaign.total_recipients || 0,
      opened: campaign.opened_count || 0,
      clicked: campaign.clicked_count || 0,
      openRate: campaign.delivered_count && campaign.delivered_count > 0 
        ? ((campaign.opened_count || 0) / campaign.delivered_count * 100) 
        : 0
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No campaign data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'openRate') {
              return [`${Number(value).toFixed(1)}%`, 'Open Rate'];
            }
            return [value, name];
          }}
        />
        <Bar dataKey="sent" fill="#8884d8" name="Sent" />
        <Bar dataKey="opened" fill="#82ca9d" name="Opened" />
        <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
      </BarChart>
    </ResponsiveContainer>
  );
}
