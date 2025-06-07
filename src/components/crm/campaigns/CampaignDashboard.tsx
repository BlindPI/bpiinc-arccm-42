
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Download,
  Send,
  Pause,
  Play
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { EmailCampaignBuilder } from '@/components/crm/campaigns/EmailCampaignBuilder';
import { toast } from 'sonner';
import type { EmailCampaign } from '@/services/crm/emailCampaignService';

export function CampaignDashboard() {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | undefined>();
  const [builderOpen, setBuilderOpen] = useState(false);

  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const deleteMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.deleteEmailCampaign(campaignId),
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to delete campaign');
    }
  });

  const sendMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.sendCampaign(campaignId),
    onSuccess: () => {
      toast.success('Campaign sent successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to send campaign');
    }
  });

  const handleCreateCampaign = () => {
    setSelectedCampaign(undefined);
    setBuilderOpen(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setBuilderOpen(true);
  };

  const handleDeleteCampaign = (campaign: EmailCampaign) => {
    if (confirm(`Are you sure you want to delete the campaign "${campaign.campaign_name}"?`)) {
      deleteMutation.mutate(campaign.id);
    }
  };

  const handleSendCampaign = (campaign: EmailCampaign) => {
    if (confirm(`Are you sure you want to send the campaign "${campaign.campaign_name}"?`)) {
      sendMutation.mutate(campaign.id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Campaigns refreshed');
  };

  const handleExport = () => {
    const headers = ['Campaign Name', 'Status', 'Recipients', 'Open Rate', 'Click Rate', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...campaigns.map(campaign => [
        `"${campaign.campaign_name}"`,
        campaign.status || 'draft',
        campaign.total_recipients || 0,
        campaign.opened_count ? `${((campaign.opened_count / (campaign.total_recipients || 1)) * 100).toFixed(1)}%` : '0%',
        campaign.clicked_count ? `${((campaign.clicked_count / (campaign.total_recipients || 1)) * 100).toFixed(1)}%` : '0%',
        new Date(campaign.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Campaigns exported successfully');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Dashboard</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No campaigns found. Create your first campaign to get started.</p>
                <Button onClick={handleCreateCampaign} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{campaign.campaign_name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {getStatusIcon(campaign.status)}
                            <span className="ml-1">{campaign.status || 'draft'}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{campaign.subject_line}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Recipients: {campaign.total_recipients || 0}</span>
                          {campaign.opened_count && (
                            <span>
                              Opens: {campaign.opened_count} 
                              ({((campaign.opened_count / (campaign.total_recipients || 1)) * 100).toFixed(1)}%)
                            </span>
                          )}
                          {campaign.clicked_count && (
                            <span>
                              Clicks: {campaign.clicked_count}
                              ({((campaign.clicked_count / (campaign.total_recipients || 1)) * 100).toFixed(1)}%)
                            </span>
                          )}
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSendCampaign(campaign)}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCampaign(campaign)}
                              className="text-red-600"
                              disabled={campaign.status === 'sending'}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {builderOpen && (
        <EmailCampaignBuilder
          campaign={selectedCampaign}
          onSave={() => {
            setBuilderOpen(false);
            queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
          }}
          onCancel={() => setBuilderOpen(false)}
        />
      )}
    </>
  );
}
