import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, EmailCampaign } from '@/services/crm/emailCampaignService';
import { useRealtimeCRMData } from '@/hooks/useRealtimeCRMData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Plus,
  Send,
  Edit,
  Trash2,
  Calendar,
  Users,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Eye,
  Download,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignManagerProps {
  className?: string;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ className }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const queryClient = useQueryClient();
  
  // Enable real-time updates
  useRealtimeCRMData();

  // Fetch campaigns with real-time updates
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['email-campaigns', statusFilter, typeFilter],
    queryFn: () => EmailCampaignService.getEmailCampaigns({
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(typeFilter !== 'all' && { campaign_type: typeFilter })
    })
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.createEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setIsCreateDialogOpen(false);
      toast.success('Campaign created successfully');
    },
    onError: () => {
      toast.error('Failed to create campaign');
    }
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EmailCampaign> }) =>
      EmailCampaignService.updateEmailCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      toast.success('Campaign updated successfully');
    },
    onError: () => {
      toast.error('Failed to update campaign');
    }
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.deleteEmailCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.sendCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: () => {
      toast.error('Failed to send campaign');
    }
  });

  // Duplicate campaign mutation
  const duplicateCampaignMutation = useMutation({
    mutationFn: EmailCampaignService.duplicateCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate campaign');
    }
  });

  const handleExportCampaigns = async () => {
    try {
      const csvContent = await EmailCampaignService.exportCampaignData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-campaigns-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Campaigns exported successfully');
    } catch (error) {
      toast.error('Failed to export campaigns');
    }
  };

  const handleDeleteCampaign = (campaign: EmailCampaign) => {
    if (confirm(`Are you sure you want to delete the campaign "${campaign.campaign_name}"?`)) {
      deleteCampaignMutation.mutate(campaign.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'sending': return <Play className="h-4 w-4" />;
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'outline';
      case 'sending': return 'default';
      case 'sent': return 'default';
      case 'paused': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (!campaign.delivered_count || campaign.delivered_count === 0) return 0;
    return Math.round(((campaign.opened_count || 0) / campaign.delivered_count) * 100);
  };

  const calculateClickRate = (campaign: EmailCampaign) => {
    if (!campaign.opened_count || campaign.opened_count === 0) return 0;
    return Math.round(((campaign.clicked_count || 0) / campaign.opened_count) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaign Manager</h2>
          <p className="text-muted-foreground">
            Create, manage, and analyze your email marketing campaigns with real-time updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCampaigns}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Email Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new email campaign to engage with your leads
                </DialogDescription>
              </DialogHeader>
              <CampaignForm
                onSubmit={(data) => createCampaignMutation.mutate(data)}
                isLoading={createCampaignMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="type-filter">Type:</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="nurture">Nurture</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                    <CardDescription>{campaign.subject_line}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(campaign.status)} className="flex items-center gap-1">
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{campaign.campaign_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipients</p>
                    <p className="font-medium">{campaign.total_recipients || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open Rate</p>
                    <p className="font-medium">{calculateOpenRate(campaign)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Click Rate</p>
                    <p className="font-medium">{calculateClickRate(campaign)}%</p>
                  </div>
                </div>

                {campaign.scheduled_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    Scheduled: {formatDate(campaign.scheduled_date)}
                  </div>
                )}

                {campaign.sent_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Send className="mr-2 h-4 w-4" />
                    Sent: {formatDate(campaign.sent_date)}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateCampaignMutation.mutate(campaign.id)}
                      disabled={duplicateCampaignMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign)}
                      disabled={deleteCampaignMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => sendCampaignMutation.mutate(campaign.id)}
                      disabled={sendCampaignMutation.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendCampaignMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  )}
                  
                  {campaign.status === 'sent' && (
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {campaigns.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first email campaign
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your email campaign settings
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignForm
              campaign={selectedCampaign}
              onSubmit={(data) => updateCampaignMutation.mutate({
                id: selectedCampaign.id,
                updates: data
              })}
              isLoading={updateCampaignMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Campaign Form Component
interface CampaignFormProps {
  campaign?: EmailCampaign;
  onSubmit: (data: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>) => void;
  isLoading: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ campaign, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    campaign_name: campaign?.campaign_name || '',
    campaign_type: campaign?.campaign_type || 'promotional',
    subject_line: campaign?.subject_line || '',
    target_audience: campaign?.target_audience || '',
    status: campaign?.status || 'draft',
    scheduled_date: campaign?.scheduled_date || '',
    geographic_targeting: campaign?.geographic_targeting || [],
    industry_targeting: campaign?.industry_targeting || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      total_recipients: campaign?.total_recipients,
      delivered_count: campaign?.delivered_count,
      opened_count: campaign?.opened_count,
      clicked_count: campaign?.clicked_count,
      bounced_count: campaign?.bounced_count,
      unsubscribed_count: campaign?.unsubscribed_count,
      leads_generated: campaign?.leads_generated,
      opportunities_created: campaign?.opportunities_created,
      revenue_attributed: campaign?.revenue_attributed,
      sent_date: campaign?.sent_date,
      created_by: campaign?.created_by
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaign_name">Campaign Name</Label>
          <Input
            id="campaign_name"
            value={formData.campaign_name}
            onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
            placeholder="Enter campaign name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign_type">Campaign Type</Label>
          <Select
            value={formData.campaign_type}
            onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="nurture">Nurture</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_line">Subject Line</Label>
        <Input
          id="subject_line"
          value={formData.subject_line}
          onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
          placeholder="Enter email subject line"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_audience">Target Audience Description</Label>
        <Textarea
          id="target_audience"
          value={formData.target_audience}
          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          placeholder="Describe your target audience..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Scheduled Date</Label>
          <Input
            id="scheduled_date"
            type="datetime-local"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
};
