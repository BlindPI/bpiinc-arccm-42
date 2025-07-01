import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Eye,
  Calendar,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { EnhancedEmailCampaignService } from '@/services/email/enhancedEmailCampaignService';
import { PROFESSIONAL_EMAIL_TEMPLATES } from '@/services/email/professionalEmailTemplates';
import { UnifiedCRMService } from '@/services/crm/unifiedCRMService';
import { toast } from 'sonner';

interface CampaignFormData {
  campaign_name: string;
  campaign_type: string;
  template_id: string;
  subject_line: string;
  target_audience: 'all_contacts' | 'leads' | 'customers' | 'custom';
  send_immediately: boolean;
  scheduled_send_time?: Date;
}

export function ProfessionalEmailCampaignManager() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState('');
  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_name: '',
    campaign_type: 'marketing',
    template_id: '',
    subject_line: '',
    target_audience: 'all_contacts',
    send_immediately: false
  });

  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => UnifiedCRMService.getEmailCampaigns()
  });

  // Fetch CRM stats for audience sizing
  const { data: crmStats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => UnifiedCRMService.getCRMStats()
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: CampaignFormData) => 
      EnhancedEmailCampaignService.createCampaign({
        campaign_name: data.campaign_name,
        campaign_type: data.campaign_type,
        template_id: data.template_id,
        subject_line: data.subject_line,
        target_audience: data.target_audience,
        send_immediately: data.send_immediately,
        scheduled_send_time: data.scheduled_send_time
      }),
    onSuccess: () => {
      toast.success('Campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => 
      EnhancedEmailCampaignService.sendCampaign(campaignId),
    onSuccess: (result) => {
      toast.success(`Campaign sent to ${result.sent_count} recipients!`);
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    },
    onError: (error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      campaign_type: 'marketing',
      template_id: '',
      subject_line: '',
      target_audience: 'all_contacts',
      send_immediately: false
    });
    setSelectedTemplate('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = PROFESSIONAL_EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        subject_line: template.subject_template
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handlePreviewTemplate = (templateId: string) => {
    setPreviewTemplate(templateId);
  };

  const getAudienceSize = (audience: string) => {
    if (!crmStats) return 0;
    switch (audience) {
      case 'all_contacts': return crmStats.total_leads + (crmStats as any).total_contacts || 0;
      case 'leads': return crmStats.total_leads;
      case 'customers': return (crmStats as any).total_contacts || 0;
      default: return 0;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'sending':
        return <Badge variant="default"><Zap className="w-3 h-3 mr-1" />Sending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professional Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage professional email marketing campaigns with enterprise-grade templates
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Mail className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Professional Email Campaign</DialogTitle>
              <DialogDescription>
                Design a professional email campaign using our enterprise-grade templates
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="Q2 Training Program Launch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="welcome">Welcome Series</SelectItem>
                      <SelectItem value="training">Training Promotion</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-3">
                <Label>Professional Email Template</Label>
                <div className="grid grid-cols-1 gap-3">
                  {PROFESSIONAL_EMAIL_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="outline" className="mt-2">{template.category}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewTemplate(template.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Line */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="subject_line">Subject Line</Label>
                  <Input
                    id="subject_line"
                    value={formData.subject_line}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                    placeholder="Professional subject line..."
                  />
                </div>
              )}

              {/* Target Audience */}
              <div className="space-y-3">
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'all_contacts', label: 'All Contacts', icon: Users },
                    { value: 'leads', label: 'Leads Only', icon: Target },
                    { value: 'customers', label: 'Customers', icon: CheckCircle },
                    { value: 'custom', label: 'Custom Filter', icon: BarChart3 }
                  ].map((audience) => {
                    const Icon = audience.icon;
                    const size = getAudienceSize(audience.value);
                    return (
                      <div
                        key={audience.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.target_audience === audience.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, target_audience: audience.value as any }))}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{audience.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ~{size} recipients
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Send Options */}
              <div className="space-y-3">
                <Label>Send Options</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_immediately"
                    checked={formData.send_immediately}
                    onChange={(e) => setFormData(prev => ({ ...prev, send_immediately: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="send_immediately">Send immediately after creation</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createCampaignMutation.mutate(formData)}
                disabled={!formData.campaign_name || !selectedTemplate || createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaignsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Clock className="w-8 h-8 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first professional email campaign to engage with your audience
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {campaign.campaign_name}
                          {getCampaignStatusBadge(campaign.status)}
                        </CardTitle>
                        <CardDescription>
                          {campaign.campaign_type} • Created {new Date(campaign.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => sendCampaignMutation.mutate(campaign.id)}
                            disabled={sendCampaignMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recipients</p>
                        <p className="font-semibold">{(campaign as any).total_recipients || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sent</p>
                        <p className="font-semibold">{(campaign as any).sent_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Open Rate</p>
                        <p className="font-semibold">{(campaign as any).open_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Click Rate</p>
                        <p className="font-semibold">{(campaign as any).click_rate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {PROFESSIONAL_EMAIL_TEMPLATES.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Variables:</strong> {template.variables.join(', ')}</p>
                    <p className="mt-2"><strong>Subject:</strong> {template.subject_template}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">
                  Professional email campaigns
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.length > 0
                    ? Math.round(campaigns.reduce((sum, c) => sum + ((c as any).open_rate || 0), 0) / campaigns.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Industry average: 25%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + ((c as any).total_recipients || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all campaigns
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate('')}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview of the professional email template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(() => {
                const template = PROFESSIONAL_EMAIL_TEMPLATES.find(t => t.id === previewTemplate);
                if (!template) return null;
                
                const preview = EnhancedEmailCampaignService.testTemplateRendering(previewTemplate, {
                  first_name: 'John',
                  last_name: 'Doe',
                  company_name: 'Professional Training Institute'
                });
                
                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Subject Line</Label>
                      <div className="p-3 bg-gray-50 rounded border">
                        {preview.subject}
                      </div>
                    </div>
                    <div>
                      <Label>Email Content</Label>
                      <div 
                        className="p-4 bg-white border rounded max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}