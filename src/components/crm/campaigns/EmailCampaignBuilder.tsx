
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Save, 
  Eye, 
  Users, 
  Calendar, 
  Settings,
  Template,
  Zap,
  Mail,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, EmailCampaign } from '@/services/crm/emailCampaignService';

interface EmailCampaignBuilderProps {
  campaignId?: string;
  onSave?: (campaign: EmailCampaign) => void;
  onCancel?: () => void;
}

export function EmailCampaignBuilder({ campaignId, onSave, onCancel }: EmailCampaignBuilderProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [campaignData, setCampaignData] = useState<Partial<EmailCampaign>>({
    campaign_name: '',
    campaign_type: 'newsletter',
    status: 'draft',
    subject_line: '',
    content: '',
    sender_name: 'Training Company',
    sender_email: 'noreply@trainingcompany.com',
    reply_to_email: 'support@trainingcompany.com',
    target_audience: {},
    tracking_enabled: true
  });

  const { data: templates } = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: () => EmailCampaignService.getCampaignTemplates()
  });

  const { data: automationTriggers } = useQuery({
    queryKey: ['automation-triggers'],
    queryFn: () => EmailCampaignService.getAutomationTriggers()
  });

  const saveCampaignMutation = useMutation({
    mutationFn: (data: Partial<EmailCampaign>) => 
      campaignId 
        ? EmailCampaignService.updateEmailCampaign(campaignId, data)
        : EmailCampaignService.createEmailCampaign(data),
    onSuccess: (campaign) => {
      toast.success(campaignId ? 'Campaign updated successfully' : 'Campaign created successfully');
      queryClient.invalidateQueries(['email-campaigns']);
      onSave?.(campaign);
    },
    onError: () => {
      toast.error('Failed to save campaign');
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (id: string) => EmailCampaignService.sendCampaign(id),
    onSuccess: () => {
      toast.success('Campaign sent successfully');
      queryClient.invalidateQueries(['email-campaigns']);
    },
    onError: () => {
      toast.error('Failed to send campaign');
    }
  });

  const handleSave = () => {
    if (!campaignData.campaign_name || !campaignData.subject_line || !campaignData.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveCampaignMutation.mutate(campaignData);
  };

  const handleSend = () => {
    if (!campaignId) {
      toast.error('Please save the campaign first');
      return;
    }
    sendCampaignMutation.mutate(campaignId);
  };

  const loadTemplate = (template: any) => {
    setCampaignData(prev => ({
      ...prev,
      subject_line: template.subject_line,
      content: template.content,
      html_content: template.html_content
    }));
    toast.success('Template loaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {campaignId ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <p className="text-muted-foreground">
            Build and manage your email marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSend} disabled={!campaignId}>
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">
            <Mail className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="content">
            <Template className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="h-4 w-4 mr-2" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    value={campaignData.campaign_name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <Label htmlFor="campaignType">Campaign Type</Label>
                  <Select
                    value={campaignData.campaign_type}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, campaign_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="drip">Drip Campaign</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subjectLine">Subject Line *</Label>
                <Input
                  id="subjectLine"
                  value={campaignData.subject_line}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, subject_line: e.target.value }))}
                  placeholder="Enter email subject line"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={campaignData.sender_name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, sender_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={campaignData.sender_email}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, sender_email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    value={campaignData.reply_to_email}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, reply_to_email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="trackingEnabled"
                  checked={campaignData.tracking_enabled}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, tracking_enabled: checked }))}
                />
                <Label htmlFor="trackingEnabled">Enable tracking (opens, clicks, etc.)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="content">Email Content *</Label>
                    <Textarea
                      id="content"
                      value={campaignData.content}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your email content here..."
                      className="min-h-[300px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      Insert Variable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates?.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => loadTemplate(template)}
                      >
                        <h4 className="font-medium">{template.template_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.template_type}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Audience Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_contacts">All Contacts</SelectItem>
                      <SelectItem value="leads">Leads Only</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Recipients</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      <Users className="h-4 w-4 mr-1" />
                      1,245 recipients
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Audience Filters</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Value" className="flex-1" />
                    <Button variant="outline" size="sm">Add Filter</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Send Option</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select send option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      <SelectItem value="recurring">Recurring Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sendDate">Send Date</Label>
                  <Input
                    id="sendDate"
                    type="date"
                    value={campaignData.send_date ? new Date(campaignData.send_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, send_date: new Date(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sendTime">Send Time</Label>
                  <Input
                    id="sendTime"
                    type="time"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="enableAutomation" />
                <Label htmlFor="enableAutomation">Enable automation for this campaign</Label>
              </div>

              <Separator />

              <div>
                <Label>Trigger Event</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    {automationTriggers?.map((trigger) => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        {trigger.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Automation Conditions</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground">
                    Add conditions to determine when this campaign should be triggered automatically.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Condition
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
