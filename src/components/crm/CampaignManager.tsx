import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaign } from '@/types/analytics';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function CampaignManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const queryClient = useQueryClient();

  // Fetch email campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async (): Promise<EmailCampaign[]> => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(campaign => ({
        ...campaign,
        created_at: campaign.created_at || new Date().toISOString(),
        updated_at: campaign.updated_at || new Date().toISOString()
      })) || [];
    }
  });

  // Create/Update campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          campaign_type: campaignData.campaign_type,
          status: campaignData.status,
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
    name: '',
    subject: '',
    content: '',
    campaign_type: 'newsletter',
    status: 'draft',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  const handleEdit = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      campaign_type: campaign.campaign_type,
      status: campaign.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      campaign_type: 'newsletter',
      status: 'draft',
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting campaign:", error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Manage and automate your email marketing efforts
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
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="campaign_type">Campaign Type</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaign_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="drip">Drip</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
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
              <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No email campaigns created</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
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
