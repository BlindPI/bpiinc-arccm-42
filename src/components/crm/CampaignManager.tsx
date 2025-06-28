
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaign } from '@/types/analytics';
import { Mail, Plus, Edit, Trash2, Send } from 'lucide-react';

export function CampaignManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const queryClient = useQueryClient();

  // Fetch email campaigns with proper field mapping
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async (): Promise<EmailCampaign[]> => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(campaign => ({
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        subject_line: campaign.subject_line,
        content: campaign.content,
        campaign_type: campaign.campaign_type as 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up',
        status: campaign.status,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        html_content: campaign.html_content,
        sender_name: campaign.sender_name,
        sender_email: campaign.sender_email,
        reply_to_email: campaign.reply_to_email,
        target_audience: campaign.target_audience,
        send_date: campaign.send_date,
        created_by: campaign.created_by,
        total_recipients: campaign.total_recipients,
        delivered_count: campaign.delivered_count,
        opened_count: campaign.opened_count,
        clicked_count: campaign.clicked_count,
        bounced_count: campaign.bounced_count,
        unsubscribed_count: campaign.unsubscribed_count,
        automation_rules: campaign.automation_rules,
        tracking_enabled: campaign.tracking_enabled
      })) || [];
    }
  });

  // Create/Update campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: Partial<EmailCampaign>) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          campaign_name: campaignData.campaign_name,
          subject_line: campaignData.subject_line,
          content: campaignData.content,
          campaign_type: campaignData.campaign_type,
          sender_name: campaignData.sender_name || 'Training Company',
          sender_email: campaignData.sender_email || 'noreply@trainingcompany.com',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowForm(false);
      setEditingCampaign(null);
    }
  });

  const [formData, setFormData] = useState({
    campaign_name: '',
    subject_line: '',
    content: '',
    campaign_type: 'newsletter' as const,
    sender_name: 'Training Company',
    sender_email: 'noreply@trainingcompany.com'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      subject_line: '',
      content: '',
      campaign_type: 'newsletter',
      sender_name: 'Training Company',
      sender_email: 'noreply@trainingcompany.com'
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage email marketing campaigns
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="campaign_name">Campaign Name</Label>
                <Input
                  id="campaign_name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject_line">Subject Line</Label>
                <Input
                  id="subject_line"
                  value={formData.subject_line}
                  onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="campaign_type">Campaign Type</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up') =>
                    setFormData({ ...formData, campaign_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="drip">Drip Campaign</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending}>
                  {createCampaignMutation.isPending ? 'Creating...' : editingCampaign ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No email campaigns found</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{campaign.subject_line}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
