
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export interface CampaignAnalyticsProps {
  analytics?: {
    performanceData?: any[];
    conversionData?: any[];
    engagementData?: any[];
    avg_bounce_rate?: number;
    avg_unsubscribe_rate?: number;
    averageOpenRate?: number;
    averageClickRate?: number;
    totalRevenue?: number;
    [key: string]: any;
  };
}

export function CampaignAnalytics({ analytics = {} }: CampaignAnalyticsProps) {
  // DEBUG: Log what analytics data we're receiving
  console.log('🔍 CampaignAnalytics received analytics:', analytics);
  console.log('🔍 Analytics performanceData:', analytics?.performanceData);
  console.log('🔍 Analytics engagementData:', analytics?.engagementData);

  // Use real data if available, otherwise fall back to empty arrays
  const performanceData = analytics?.performanceData && analytics.performanceData.length > 0
    ? analytics.performanceData
    : [
        { name: 'newsletter', sent: 0, opened: 0, clicked: 0, converted: 0 },
        { name: 'promotional', sent: 0, opened: 0, clicked: 0, converted: 0 },
        { name: 'follow_up', sent: 0, opened: 0, clicked: 0, converted: 0 },
      ];

  const engagementData = analytics?.engagementData && analytics.engagementData.length > 0
    ? analytics.engagementData
    : [
        { date: new Date().toISOString().substring(0, 7), openRate: 0, clickRate: 0 }
      ];

  // Calculate real-time metrics from analytics data
  const totalSent = performanceData.reduce((sum, item) => sum + (item.sent || 0), 0);
  const totalOpened = performanceData.reduce((sum, item) => sum + (item.opened || 0), 0);
  const totalClicked = performanceData.reduce((sum, item) => sum + (item.clicked || 0), 0);
  
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;
  const bounceRate = analytics?.avg_bounce_rate || 2.8;
  const unsubscribeRate = analytics?.avg_unsubscribe_rate || 0.5;

  // DEBUG: Log what data we're actually using
  console.log('🔍 Using performanceData:', performanceData);
  console.log('🔍 Using engagementData:', engagementData);
  console.log('🔍 Calculated metrics:', { avgOpenRate, avgClickRate, totalSent, totalOpened, totalClicked });
  console.log('🔍 Is using real data?', analytics?.performanceData && analytics.performanceData.length > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Email metrics by campaign type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                <Bar dataKey="opened" fill="#82ca9d" name="Opened" />
                <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Open and click rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="openRate" stroke="#8884d8" name="Open Rate %" />
                <Line type="monotone" dataKey="clickRate" stroke="#82ca9d" name="Click Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average Open Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average Click Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{unsubscribeRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Unsubscribe Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
