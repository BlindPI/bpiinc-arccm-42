
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, MousePointer } from 'lucide-react';
import type { CampaignAnalytics as CampaignAnalyticsType } from '@/types/crm';

interface CampaignAnalyticsProps {
  analytics: CampaignAnalyticsType;
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ analytics }) => {
  const deliveryRate = analytics.delivery_rate || 0;
  const openRate = analytics.open_rate || 0;
  const clickRate = analytics.click_rate || 0;
  const conversionRate = analytics.conversion_rate || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_sent || 0} emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.total_sent || 0) * deliveryRate / 100 * openRate / 100)} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.total_sent || 0) * deliveryRate / 100 * openRate / 100 * clickRate / 100)} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              of total recipients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.geographic_breakdown.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{location.location}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{location.opens} opens</Badge>
                  <Badge variant="outline">{location.clicks} clicks</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.device_breakdown.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{device.device}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{device.opens} opens</Badge>
                  <Badge variant="outline">{device.clicks} clicks</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
