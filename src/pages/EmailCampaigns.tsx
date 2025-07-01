
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Send, 
  Eye, 
  Mail,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, type EmailCampaign } from '@/services/crm/emailCampaignService';
import { EmailCampaignBuilder } from '@/components/crm/campaigns/EmailCampaignBuilder';
import { CampaignAnalytics } from '@/components/crm/campaigns/CampaignAnalytics';
import { toast } from 'sonner';

export default function EmailCampaigns() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const { data: performanceSummary } = useQuery({
    queryKey: ['campaign-performance'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary()
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.sendCampaign(campaignId),
    onSuccess: () => {
      toast.success('Campaign sent successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to send campaign');
      console.error('Send campaign error:', error);
    }
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.duplicateCampaign(campaignId),
    onSuccess: () => {
      toast.success('Campaign duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to duplicate campaign');
      console.error('Duplicate campaign error:', error);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            ← Back to Campaigns
          </Button>
        </div>
        <EmailCampaignBuilder 
          campaignId={selectedCampaign || undefined}
          onClose={() => {
            setShowBuilder(false);
            setSelectedCampaign(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your email marketing campaigns
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {performanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{performanceSummary.totalCampaigns}</p>
                </div>
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{performanceSummary.activeCampaigns}</p>
                </div>
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                  <p className="text-2xl font-bold">{performanceSummary.totalRecipients.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                  <p className="text-2xl font-bold">{performanceSummary.averageOpenRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Manage your email marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{campaign.campaign_name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.subject_line}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Type: {campaign.campaign_type}</span>
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                          {campaign.total_recipients && (
                            <span>Recipients: {campaign.total_recipients}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign.id);
                            setShowBuilder(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => sendCampaignMutation.mutate(campaign.id)}
                            disabled={sendCampaignMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => duplicateCampaignMutation.mutate(campaign.id)}
                          disabled={duplicateCampaignMutation.isPending}
                        >
                          Duplicate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first email campaign to get started
                  </p>
                  <Button onClick={() => setShowBuilder(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <CampaignAnalytics />
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Pre-built templates for your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Template management coming soon</h3>
                <p className="text-muted-foreground">
                  Create and manage reusable email templates
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
