
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface EmailCampaignBuilderProps {
  campaign?: any;
  onSave: (campaignData: any) => void;
  onCancel: () => void;
}

export function EmailCampaignBuilder({ campaign, onSave, onCancel }: EmailCampaignBuilderProps) {
  const [formData, setFormData] = useState({
    campaign_name: campaign?.campaign_name || '',
    subject_line: campaign?.subject_line || '',
    email_content: campaign?.email_content || '',
    status: campaign?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaign_name">Campaign Name</Label>
            <Input
              id="campaign_name"
              value={formData.campaign_name}
              onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="subject_line">Subject Line</Label>
            <Input
              id="subject_line"
              value={formData.subject_line}
              onChange={(e) => setFormData({...formData, subject_line: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="email_content">Email Content</Label>
            <Textarea
              id="email_content"
              rows={6}
              value={formData.email_content}
              onChange={(e) => setFormData({...formData, email_content: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
