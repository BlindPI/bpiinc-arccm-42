
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmailCampaignService } from '@/services/crm/serviceTransition';
import type { EmailCampaign } from '@/types/unified-crm';

export function ProfessionalEmailWorkflows() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: EmailCampaignService.getEmailCampaigns
  });

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Email Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading campaigns...</div>
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No campaigns found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{campaign.campaign_name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.subject_line}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Sent: {campaign.sent_count || 0}</span>
                    <span>Opened: {campaign.opened_count || 0}</span>
                    <span>
                      Open Rate: {
                        campaign.sent_count && campaign.sent_count > 0
                          ? ((campaign.opened_count || 0) / campaign.sent_count * 100).toFixed(1)
                          : 0
                      }%
                    </span>
                  </div>
                </div>
                <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
