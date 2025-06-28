
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Send, Edit, Trash2, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/serviceTransition';
import { DatabaseAdapters } from '@/utils/database-adapters';
import { toast } from 'sonner';
import type { EmailCampaign } from '@/types/analytics';

export function CampaignManager() {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawCampaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const campaigns = await EmailCampaignService.getEmailCampaigns();
      // Transform database campaigns to match EmailCampaign interface
      return campaigns.map(campaign => DatabaseAdapters.adaptEmailCampaign(campaign));
    }
  });

  // Performance summary query
  const { data: performanceSummary } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary()
  });

  const createCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.createEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowCreateDialog(false);
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      toast.error(`Error creating campaign: ${error.message}`);
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmailCampaign> }) =>
      EmailCampaignService.updateEmailCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowEditDialog(false);
      setSelectedCampaign(null);
      toast.success('Campaign updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Error updating campaign: ${error.message}`);
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.deleteEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Error deleting campaign: ${error.message}`);
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: (error: any) => {
      toast.error(`Error sending campaign: ${error.message}`);
    }
  });

  const handleCreateCampaign = (formData: FormData) => {
    const campaignData = {
      campaign_name: formData.get('name') as string,
      subject_line: formData.get('subject') as string,
      content: formData.get('content') as string,
      campaign_type: formData.get('campaign_type') as EmailCampaign['campaign_type'],
      status: 'draft' as const,
      sender_name: formData.get('sender_name') as string || 'Training Company',
      sender_email: formData.get('sender_email') as string || 'noreply@trainingcompany.com',
      reply_to_email: formData.get('reply_to_email') as string || 'support@trainingcompany.com',
      target_audience: {},
      automation_rules: {},
      tracking_enabled: true,
      created_by: 'current-user-id' // This should come from auth context
    };

    createCampaignMutation.mutate(campaignData);
  };

  const handleUpdateCampaign = (formData: FormData) => {
    if (!selectedCampaign) return;

    const updates = {
      campaign_name: formData.get('name') as string,
      subject_line: formData.get('subject') as string,
      content: formData.get('content') as string,
      campaign_type: formData.get('campaign_type') as EmailCampaign['campaign_type'],
      sender_name: formData.get('sender_name') as string,
      sender_email: formData.get('sender_email') as string,
      reply_to_email: formData.get('reply_to_email') as string
    };

    updateCampaignMutation.mutate({ id: selectedCampaign.id, updates });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleSendCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-purple-100 text-purple-800';
      case 'drip': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      case 'follow_up': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaign Manager</h1>
          <p className="text-muted-foreground">Create and manage your email campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm onSubmit={handleCreateCampaign} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Summary */}
      {performanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceSummary.total_campaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceSummary.total_sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceSummary.avg_open_rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceSummary.avg_click_rate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid gap-4">
        {rawCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCampaignTypeColor(campaign.campaign_type)}>
                    {campaign.campaign_type}
                  </Badge>
                  <Badge className={getStatusColor(campaign.status || 'draft')}>
                    {campaign.status || 'draft'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{campaign.sent_count}</div>
                    <div className="text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{campaign.delivered_count}</div>
                    <div className="text-muted-foreground">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{campaign.opened_count}</div>
                    <div className="text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{campaign.clicked_count}</div>
                    <div className="text-muted-foreground">Clicked</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{campaign.bounced_count}</div>
                    <div className="text-muted-foreground">Bounced</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    disabled={campaign.status === 'sending'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendCampaign(campaign.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignForm
              campaign={selectedCampaign}
              onSubmit={handleUpdateCampaign}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Form Component
interface CampaignFormProps {
  campaign?: EmailCampaign;
  onSubmit: (formData: FormData) => void;
}

function CampaignForm({ campaign, onSubmit }: CampaignFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={campaign?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign_type">Campaign Type</Label>
          <Select name="campaign_type" defaultValue={campaign?.campaign_type || 'newsletter'}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject Line</Label>
        <Input
          id="subject"
          name="subject"
          defaultValue={campaign?.subject}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sender_name">Sender Name</Label>
          <Input
            id="sender_name"
            name="sender_name"
            defaultValue={campaign?.sender_name || 'Training Company'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sender_email">Sender Email</Label>
          <Input
            id="sender_email"
            name="sender_email"
            type="email"
            defaultValue={campaign?.sender_email || 'noreply@trainingcompany.com'}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reply_to_email">Reply To Email</Label>
        <Input
          id="reply_to_email"
          name="reply_to_email"
          type="email"
          defaultValue={campaign?.reply_to_email || 'support@trainingcompany.com'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          rows={6}
          defaultValue={campaign?.content}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}

export default CampaignManager;
