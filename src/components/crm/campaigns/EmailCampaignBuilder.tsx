
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { EmailCampaign, TargetAudience } from '@/types/crm';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { toast } from 'sonner';

interface EmailCampaignBuilderProps {
  onCampaignCreated?: (campaign: EmailCampaign) => void;
}

export const EmailCampaignBuilder: React.FC<EmailCampaignBuilderProps> = ({ 
  onCampaignCreated 
}) => {
  const [campaign, setCampaign] = useState<Partial<EmailCampaign>>({
    campaign_name: '',
    campaign_type: 'newsletter',
    subject_line: '',
    email_content: '',
    target_audience: '',
    status: 'draft'
  });

  const [audiences] = useState<TargetAudience[]>([
    { id: '1', name: 'New Leads', criteria: {}, estimated_size: 245 },
    { id: '2', name: 'Enterprise Prospects', criteria: {}, estimated_size: 89 },
    { id: '3', name: 'Training Managers', criteria: {}, estimated_size: 156 }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign.campaign_name || !campaign.subject_line) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newCampaign = await EmailCampaignService.createEmailCampaign(campaign as Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>);
      
      if (newCampaign) {
        toast.success('Campaign created successfully');
        onCampaignCreated?.(newCampaign);
        
        // Reset form
        setCampaign({
          campaign_name: '',
          campaign_type: 'newsletter',
          subject_line: '',
          email_content: '',
          target_audience: '',
          status: 'draft'
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const selectedAudience = audiences.find(a => a.id === campaign.target_audience);
  const estimatedReach = selectedAudience?.estimated_size || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_name">Campaign Name</Label>
            <Input
              id="campaign_name"
              value={campaign.campaign_name}
              onChange={(e) => setCampaign({...campaign, campaign_name: e.target.value})}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_type">Campaign Type</Label>
            <Select
              value={campaign.campaign_type}
              onValueChange={(value) => setCampaign({...campaign, campaign_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select campaign type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="welcome">Welcome Series</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_line">Subject Line</Label>
            <Input
              id="subject_line"
              value={campaign.subject_line}
              onChange={(e) => setCampaign({...campaign, subject_line: e.target.value})}
              placeholder="Enter email subject line"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_content">Email Content</Label>
            <Textarea
              id="email_content"
              value={campaign.email_content}
              onChange={(e) => setCampaign({...campaign, email_content: e.target.value})}
              placeholder="Enter email content"
              rows={8}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Audience</Label>
            <Select
              value={campaign.target_audience}
              onValueChange={(value) => setCampaign({...campaign, target_audience: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    {audience.name} ({audience.estimated_size} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAudience && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{selectedAudience.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Estimated reach: <Badge variant="outline">{estimatedReach} contacts</Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit">
          Create Campaign
        </Button>
      </div>
    </form>
  );
};
