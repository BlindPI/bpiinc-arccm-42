
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';

interface CampaignBulkOperationsProps {
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

export function CampaignBulkOperations({ selectedItems, onSelectionChange }: CampaignBulkOperationsProps) {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(campaigns.map(campaign => campaign.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (campaignId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, campaignId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== campaignId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading campaigns...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campaign Bulk Operations</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.length === campaigns.length && campaigns.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedItems.includes(campaign.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedItems.includes(campaign.id)}
                  onCheckedChange={(checked) => handleSelectItem(campaign.id, checked as boolean)}
                />
                <div>
                  <div className="font-medium">
                    {campaign.campaign_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {campaign.campaign_type} • {campaign.total_recipients || 0} recipients
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {campaign.opened_count || 0} opens
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {campaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No campaigns found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
