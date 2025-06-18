import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Plus,
  BarChart3,
  Users,
  Send,
  Calendar,
  Target,
  TrendingUp,
  Settings,
  Zap,
  Eye,
  MousePointer,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { CampaignDashboard } from '@/components/crm/campaigns/CampaignDashboard';
import { CampaignAnalytics } from '@/components/crm/campaigns/CampaignAnalytics';
import { CampaignSettingsDialog } from '@/components/crm/campaigns/CampaignSettingsDialog';
import { TemplatePreviewDialog } from '@/components/crm/campaigns/TemplatePreviewDialog';
import { useQuery } from '@tanstack/react-query';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import '@/utils/testCampaignDiagnostics';

interface QuickStat {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
}

export default function CampaignManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Fetch performance summary for quick stats
  const { data: performanceSummary } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary()
  });

  // Fetch recent campaigns
  const { data: recentCampaigns = [] } = useQuery({
    queryKey: ['recent-campaigns'],
    queryFn: () => EmailCampaignService.getEmailCampaigns()
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => EmailCampaignService.getDefaultEmailTemplates()
  });

  const quickStats: QuickStat[] = [
    {
      title: 'Active Campaigns',
      value: recentCampaigns?.filter(c => c.status === 'sending' || c.status === 'scheduled').length.toString() || '0',
      change: 15.2,
      changeType: 'increase',
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      title: 'Total Recipients',
      value: performanceSummary?.total_recipients?.toLocaleString() || '0',
      change: 8.7,
      changeType: 'increase',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Average Open Rate',
      value: `${performanceSummary?.avg_open_rate?.toFixed(1) || '0'}%`,
      change: 3.2,
      changeType: 'increase',
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Revenue Generated',
      value: `$${(performanceSummary?.total_revenue || 0).toLocaleString()}`,
      change: 12.8,
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-orange-600'
    }
  ];

  const handleCreateCampaign = () => {
    // Redirect to the professional email campaign workflow
    window.location.href = '/dashboard?tab=email-campaigns';
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and analyze your email marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stat.change)}%
                </span>
                <span className="ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CampaignDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <CampaignAnalytics analytics={(() => {
            // DEBUG: Log what we're passing to CampaignAnalytics
            console.log('🔍 CampaignManagement passing performanceSummary to analytics:', performanceSummary);
            return performanceSummary || {};
          })()} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage and create email templates for your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {emailTemplates && emailTemplates.length > 0 ? (
                  emailTemplates.map((template, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline">{template.template_type || 'general'}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Show template preview
                              setPreviewTemplate(template);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <h3 className="font-semibold mb-2">{template.template_name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{template.subject_line}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{template.variables?.length || 0} variables</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first email template to get started.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <Button onClick={() => {
                  // Redirect to professional email campaign workflow
                  window.location.href = '/dashboard?tab=email-campaigns';
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automation Workflows
                </CardTitle>
                <CardDescription>
                  Set up automated email sequences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns && recentCampaigns.length > 0 ? (
                    recentCampaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <h4 className="font-medium">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {campaign.campaign_type} • {campaign.total_recipients || 0} recipients
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignId(campaign.id);
                              setShowCampaignBuilder(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No campaigns found. Create your first campaign to get started.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <Button
                    className="w-full"
                    onClick={() => {
                      // Redirect to professional email campaign workflow
                      window.location.href = '/dashboard?tab=email-campaigns';
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Automation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* A/B Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  A/B Testing
                </CardTitle>
                <CardDescription>
                  Test different campaign variations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No A/B Tests</h3>
                  <p className="text-muted-foreground mb-4">
                    Start testing different subject lines and content to improve your campaigns.
                  </p>
                  <Button onClick={() => {
                    // Redirect to professional email campaign workflow
                    window.location.href = '/dashboard?tab=email-campaigns';
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create A/B Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Configure default settings for your email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Campaign settings are managed through the dedicated settings dialog.
                    Click the Settings button in the header to configure your default campaign settings.
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button onClick={handleOpenSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Open Campaign Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CampaignSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />
    </div>
  );
}
