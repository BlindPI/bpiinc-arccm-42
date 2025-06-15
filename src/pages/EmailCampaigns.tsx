
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Calendar, 
  BarChart3,
  Settings,
  Copy,
  Pause,
  Play,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, EmailCampaign } from '@/services/crm/emailCampaignService';
import { EmailCampaignBuilder } from '@/components/crm/campaigns/EmailCampaignBuilder';
import { CampaignDashboard } from '@/components/crm/campaigns/CampaignDashboard';
import { CampaignAnalytics } from '@/components/crm/campaigns/CampaignAnalytics';
import { CampaignPerformanceChart } from '@/components/crm/campaigns/CampaignPerformanceChart';
import { CampaignSettingsDialog } from '@/components/crm/campaigns/CampaignSettingsDialog';
import { toast } from 'sonner';

export default function EmailCampaigns() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const { data: campaignAnalytics } = useQuery({
    queryKey: ['campaign-analytics'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary()
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => EmailCampaignService.deleteEmailCampaign(id),
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      queryClient.invalidateQueries(['email-campaigns']);
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    }
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: (id: string) => EmailCampaignService.duplicateCampaign(id),
    onSuccess: () => {
      toast.success('Campaign duplicated successfully');
      queryClient.invalidateQueries(['email-campaigns']);
    },
    onError: () => {
      toast.error('Failed to duplicate campaign');
    }
  });

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject_line?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setShowBuilder(true);
  };

  const handleEditCampaign = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setShowBuilder(true);
  };

  if (showBuilder) {
    return (
      <EmailCampaignBuilder
        campaignId={selectedCampaign}
        onSave={() => setShowBuilder(false)}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your email marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Copy className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CampaignDashboard />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.campaign_type}</Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{campaign.subject_line}</p>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Recipients:</span>
                          <span className="font-medium ml-1">{campaign.total_recipients || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Opens:</span>
                          <span className="font-medium ml-1">{campaign.opened_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clicks:</span>
                          <span className="font-medium ml-1">{campaign.clicked_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium ml-1">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCampaign(campaign.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => duplicateCampaignMutation.mutate(campaign.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'sending' ? (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No campaigns match your search criteria' : 'Get started by creating your first email campaign'}
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <CampaignAnalytics analytics={campaignAnalytics || {}} />
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignPerformanceChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Template Management</h3>
                <p className="text-muted-foreground mb-4">
                  Create and manage reusable email templates for your campaigns
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <CampaignSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
