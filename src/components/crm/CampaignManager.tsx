import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Pause, Play, Copy, Trash2 } from 'lucide-react';
import { EmailCampaignService } from '@/services/crm/serviceTransition';
import { CampaignFormDialog } from './campaigns/CampaignFormDialog';
import { toast } from 'sonner';
import type { EmailCampaign, CampaignSummary } from '@/types/unified-crm';

export function CampaignManager() {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: EmailCampaignService.getEmailCampaigns
  });

  const { data: summary } = useQuery({
    queryKey: ['campaign-summary'],
    queryFn: EmailCampaignService.getCampaignPerformanceSummary
  });

  const createMutation = useMutation({
    mutationFn: EmailCampaignService.createEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign created successfully');
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create campaign');
      console.error('Error creating campaign:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailCampaign> }) =>
      EmailCampaignService.updateEmailCampaign(id, {
        ...data,
        status: data.status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign updated successfully');
      setIsFormOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast.error('Failed to update campaign');
      console.error('Error updating campaign:', error);
    }
  });

  const sendMutation = useMutation({
    mutationFn: EmailCampaignService.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send campaign');
      console.error('Error sending campaign:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: EmailCampaignService.deleteEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign');
      console.error('Error deleting campaign:', error);
    }
  });

  const handleSubmit = async (data: Partial<EmailCampaign>) => {
    if (selectedCampaign) {
      updateMutation.mutate({ id: selectedCampaign.id, data });
    } else {
      createMutation.mutate({
        campaign_name: data.campaign_name || '',
        campaign_type: data.campaign_type || 'newsletter',
        status: 'draft',
        subject_line: data.subject_line || '',
        content: data.content || '',
        html_content: data.html_content || '',
        sender_name: data.sender_name || 'Training Company',
        sender_email: data.sender_email || 'noreply@trainingcompany.com',
        reply_to_email: data.reply_to_email,
        target_audience: data.target_audience,
        tracking_enabled: data.tracking_enabled || true,
        automation_rules: data.automation_rules || {},
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        unsubscribed_count: 0
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Send campaign error:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await EmailCampaignService.pauseCampaign(campaignId);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign paused successfully');
    } catch (error) {
      toast.error('Failed to pause campaign');
      console.error('Error pausing campaign:', error);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await EmailCampaignService.resumeCampaign(campaignId);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign resumed successfully');
    } catch (error) {
      toast.error('Failed to resume campaign');
      console.error('Error resuming campaign:', error);
    }
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    try {
      await EmailCampaignService.duplicateCampaign(campaignId);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate campaign');
      console.error('Error duplicating campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Delete campaign error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.activeCampaigns || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRecipients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageOpenRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageClickRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Campaigns</CardTitle>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading campaigns...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No campaigns found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{campaign.campaign_name}</h3>
                      <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.subject_line}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Recipients: {campaign.sent_count || 0}</span>
                      <span>Opened: {campaign.opened_count || 0}</span>
                      <span>Clicked: {campaign.clicked_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Action buttons */}
                    {campaign.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'sending' ? (
                      <Button
                        size="sm"
                        onClick={() => handlePauseCampaign(campaign.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : campaign.status === 'paused' ? (
                      <Button
                        size="sm"
                        onClick={() => handleResumeCampaign(campaign.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => handleDuplicateCampaign(campaign.id)}
                      disabled={createMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => {
                      setSelectedCampaign(campaign);
                      setIsFormOpen(true);
                    }}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        campaign={selectedCampaign}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
