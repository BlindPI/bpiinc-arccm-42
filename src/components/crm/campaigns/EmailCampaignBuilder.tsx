import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Send, 
  Save, 
  Eye, 
  Calendar, 
  Users, 
  FileText, 
  Target,
  Clock,
  Mail
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, type EmailCampaign } from '@/services/crm/emailCampaignService';
import { toast } from 'sonner';

interface EmailCampaignBuilderProps {
  campaignId?: string;
  onClose?: () => void;
}

export function EmailCampaignBuilder({ campaignId, onClose }: EmailCampaignBuilderProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState<Partial<EmailCampaign>>({
    campaign_name: '',
    campaign_type: 'newsletter',
    subject_line: '',
    content: '',
    sender_name: '',
    sender_email: '',
    status: 'draft',
    tracking_enabled: true
  });

  const { data: existingCampaign } = useQuery({
    queryKey: ['email-campaign', campaignId],
    queryFn: () => campaignId ? EmailCampaignService.getEmailCampaigns().then(campaigns => 
      campaigns.find(c => c.id === campaignId)
    ) : null,
    enabled: !!campaignId
  });

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => EmailCampaignService.getCampaignTemplates()
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: Partial<EmailCampaign>) => {
      // Ensure all required fields are present
      const campaignData = {
        campaign_name: data.campaign_name || '',
        campaign_type: data.campaign_type || 'newsletter',
        status: data.status || 'draft',
        subject_line: data.subject_line || '',
        content: data.content || '',
        sender_name: data.sender_name || '',
        sender_email: data.sender_email || '',
        target_audience: data.target_audience || {},
        created_by: 'current-user',
        tracking_enabled: data.tracking_enabled ?? true,
        ...data
      } as Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>;
      
      return EmailCampaignService.createEmailCampaign(campaignData);
    },
    onSuccess: () => {
      toast.success('Campaign created successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      onClose?.();
    },
    onError: (error) => {
      toast.error('Failed to create campaign');
      console.error('Campaign creation error:', error);
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailCampaign> }) => 
      EmailCampaignService.updateEmailCampaign(id, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      onClose?.();
    },
    onError: (error) => {
      toast.error('Failed to update campaign');
      console.error('Campaign update error:', error);
    }
  });

  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        campaign_name: existingCampaign.campaign_name,
        campaign_type: existingCampaign.campaign_type,
        subject_line: existingCampaign.subject_line,
        content: existingCampaign.content,
        sender_name: existingCampaign.sender_name,
        sender_email: existingCampaign.sender_email,
        status: existingCampaign.status,
        tracking_enabled: existingCampaign.tracking_enabled
      });
    }
  }, [existingCampaign]);

  const handleSubmit = () => {
    if (campaignId) {
      updateCampaignMutation.mutate({ id: campaignId, data: formData });
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  const handleSendTest = () => {
    toast.info('Test email sent to your inbox');
  };

  const handleSchedule = () => {
    const updatedData = { ...formData, status: 'scheduled' as const };
    if (campaignId) {
      updateCampaignMutation.mutate({ id: campaignId, data: updatedData });
    } else {
      createCampaignMutation.mutate(updatedData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {campaignId ? 'Edit Campaign' : 'Create Email Campaign'}
          </h2>
          <p className="text-muted-foreground">
            Build and customize your email campaign
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSendTest}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleSchedule}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />
            {campaignId ? 'Update' : 'Create'} Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Content</CardTitle>
              <CardDescription>
                Design your email content and subject line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select 
                    value={formData.campaign_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_type: value as any }))}
                  >
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

              <div>
                <Label htmlFor="subject_line">Subject Line</Label>
                <Input
                  id="subject_line"
                  value={formData.subject_line}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                  placeholder="Enter email subject line"
                />
              </div>

              <div>
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your email content here..."
                  rows={10}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Define who will receive this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">All Contacts</h4>
                    <p className="text-sm text-muted-foreground">Send to all contacts in your database</p>
                  </div>
                  <Badge variant="secondary">1,234 contacts</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Segment Options</h4>
                  <p className="text-sm text-muted-foreground">Choose specific segments to target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Configure sender information and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sender_name">Sender Name</Label>
                  <Input
                    id="sender_name"
                    value={formData.sender_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, sender_name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label htmlFor="sender_email">Sender Email</Label>
                  <Input
                    id="sender_email"
                    type="email"
                    value={formData.sender_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, sender_email: e.target.value }))}
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Tracking</h4>
                  <p className="text-sm text-muted-foreground">Track opens, clicks, and engagement</p>
                </div>
                <Switch
                  checked={formData.tracking_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tracking_enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
