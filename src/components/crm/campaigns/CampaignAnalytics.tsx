
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export interface CampaignAnalyticsProps {
  analytics?: {
    performanceData?: any[];
    conversionData?: any[];
    engagementData?: any[];
  };
}

export function CampaignAnalytics({ analytics = {} }: CampaignAnalyticsProps) {
  // DEBUG: Log what analytics data we're receiving
  console.log('🔍 CampaignAnalytics received analytics:', analytics);
  console.log('🔍 Analytics performanceData:', analytics?.performanceData);
  console.log('🔍 Analytics engagementData:', analytics?.engagementData);

  const performanceData = analytics?.performanceData || [
    { name: 'Newsletter', sent: 1200, opened: 480, clicked: 96, converted: 12 },
    { name: 'Promotional', sent: 800, opened: 280, clicked: 45, converted: 8 },
    { name: 'Follow-up', sent: 500, opened: 225, clicked: 38, converted: 7 },
  ];

  const engagementData = analytics?.engagementData || [
    { date: '2024-01', openRate: 22.5, clickRate: 3.8 },
    { date: '2024-02', openRate: 25.1, clickRate: 4.2 },
    { date: '2024-03', openRate: 23.8, clickRate: 3.9 },
    { date: '2024-04', openRate: 26.2, clickRate: 4.5 },
  ];

  // DEBUG: Log what data we're actually using
  console.log('🔍 Using performanceData:', performanceData);
  console.log('🔍 Using engagementData:', engagementData);
  console.log('🔍 Is using mock data?', !analytics?.performanceData && !analytics?.engagementData);

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
            <div className="text-2xl font-bold">24.3%</div>
            <p className="text-xs text-muted-foreground">Average Open Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">4.1%</div>
            <p className="text-xs text-muted-foreground">Average Click Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">2.8%</div>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0.5%</div>
            <p className="text-xs text-muted-foreground">Unsubscribe Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
