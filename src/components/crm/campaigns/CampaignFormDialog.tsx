
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { EmailCampaign, EmailCampaignType, EmailCampaignStatus } from '@/types/foundation';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Partial<EmailCampaign>;
  onSave: (campaign: Partial<EmailCampaign>) => void;
  mode: 'create' | 'edit';
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onSave,
  mode
}: CampaignFormDialogProps) {
  const [formData, setFormData] = useState<Partial<EmailCampaign>>(
    campaign || {
      campaign_name: '',
      campaign_type: 'newsletter',
      status: 'draft',
      subject_line: '',
      content: '',
      sender_name: '',
      sender_email: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof EmailCampaign, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_name">Campaign Name</Label>
              <Input
                id="campaign_name"
                value={formData.campaign_name || ''}
                onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_type">Campaign Type</Label>
              <Select
                value={formData.campaign_type}
                onValueChange={(value: EmailCampaignType) => handleInputChange('campaign_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_line">Subject Line</Label>
            <Input
              id="subject_line"
              value={formData.subject_line || ''}
              onChange={(e) => handleInputChange('subject_line', e.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                value={formData.sender_name || ''}
                onChange={(e) => handleInputChange('sender_name', e.target.value)}
                placeholder="Sender name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_email">Sender Email</Label>
              <Input
                id="sender_email"
                type="email"
                value={formData.sender_email || ''}
                onChange={(e) => handleInputChange('sender_email', e.target.value)}
                placeholder="sender@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter campaign content"
              rows={6}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Campaign' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
