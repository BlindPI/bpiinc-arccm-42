import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Send, Users, BarChart3, Settings, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useCRMContacts } from '@/hooks/useCRMContacts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  campaign_type: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  recipient_count?: number;
  sent_count?: number;
  open_rate?: number;
  click_rate?: number;
  created_at: string;
  updated_at: string;
}

export function ProfessionalEmailWorkflows() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<EmailCampaign>>({
    name: '',
    subject: '',
    content: '',
    campaign_type: 'newsletter',
    status: 'draft'
  });

  const queryClient = useQueryClient();
  const { data: contacts = [] } = useCRMContacts();

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailCampaign[];
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign>) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{
          ...campaign,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        campaign_type: 'newsletter',
        status: 'draft'
      });
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaignId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign sent successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    }
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject) {
      toast.error('Please fill in required fields');
      return;
    }
    createCampaignMutation.mutate(newCampaign);
  };

  const handleSendCampaign = (campaignId: string) => {
    sendCampaignMutation.mutate(campaignId);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Mail },
          { id: 'templates', label: 'Templates', icon: Edit },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaign Management */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Email Campaigns</h2>
              <p className="text-muted-foreground">Create and manage your email marketing campaigns</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Create a new email campaign to engage with your contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name *</Label>
                      <Input
                        id="campaign-name"
                        value={newCampaign.name || ''}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-type">Campaign Type</Label>
                      <Select
                        value={newCampaign.campaign_type || 'newsletter'}
                        onValueChange={(value: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up') => 
                          setNewCampaign(prev => ({ ...prev, campaign_type: value }))
                        }
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
                    <Label htmlFor="campaign-subject">Subject Line *</Label>
                    <Input
                      id="campaign-subject"
                      value={newCampaign.subject || ''}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-content">Email Content</Label>
                    <Textarea
                      id="campaign-content"
                      value={newCampaign.content || ''}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter email content"
                      rows={8}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateCampaign}
                      disabled={createCampaignMutation.isPending}
                    >
                      {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Campaigns List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Manage your email marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns found. Create your first campaign to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.campaign_type?.charAt(0).toUpperCase() + campaign.campaign_type?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'draft' ? 'secondary' :
                            campaign.status === 'scheduled' ? 'outline' : 'destructive'
                          }>
                            {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Total: {campaign.recipient_count || 0}</div>
                            <div className="text-muted-foreground">Sent: {campaign.sent_count || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Opens: {campaign.open_rate || 0}%</div>
                            <div className="text-muted-foreground">Clicks: {campaign.click_rate || 0}%</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCampaign(campaign)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {campaign.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={sendCampaignMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other tabs content would go here */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Manage your email templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Email templates management coming soon...
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Analytics</CardTitle>
            <CardDescription>Track your email campaign performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Email analytics dashboard coming soon...
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure your email preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Email settings panel coming soon...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
