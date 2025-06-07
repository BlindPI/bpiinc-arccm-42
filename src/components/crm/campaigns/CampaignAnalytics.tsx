
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CampaignAnalyticsProps {
  analytics: {
    total_campaigns?: number;
    total_recipients?: number;
    avg_open_rate?: number;
    avg_click_rate?: number;
    total_revenue?: number;
  };
}

export function CampaignAnalytics({ analytics }: CampaignAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_campaigns || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total_recipients || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Open Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(analytics.avg_open_rate || 0).toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Click Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(analytics.avg_click_rate || 0).toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(analytics.total_revenue || 0).toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
