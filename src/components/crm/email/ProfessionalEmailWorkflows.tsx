import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Users,
  Award,
  BookOpen,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Target,
  Sparkles
} from 'lucide-react';
import { EnhancedEmailCampaignService } from '@/services/email/enhancedEmailCampaignService';
import { EmailCampaignService } from '@/services/crm/emailCampaignService';
import { ResendEmailService } from '@/services/email/resendEmailService';
import { UnifiedCRMService } from '@/services/crm/unifiedCRMService';

interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  template_id: string;
  automation_enabled: boolean;
}

const EMAIL_WORKFLOWS: EmailWorkflow[] = [
  {
    id: 'welcome-sequence',
    name: 'Professional Welcome Sequence',
    description: 'Send a professional welcome email to new contacts and leads',
    icon: Users,
    category: 'onboarding',
    template_id: 'welcome-professional',
    automation_enabled: true
  },
  {
    id: 'training-promotion',
    name: 'Training Program Promotion',
    description: 'Promote training programs to qualified leads and contacts',
    icon: BookOpen,
    category: 'marketing',
    template_id: 'training-program-promotion',
    automation_enabled: false
  },
  {
    id: 'certification-achievement',
    name: 'Certification Achievement',
    description: 'Celebrate certification achievements with professional recognition',
    icon: Award,
    category: 'achievement',
    template_id: 'certification-achievement',
    automation_enabled: true
  }
];

export function ProfessionalEmailWorkflows() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<EmailWorkflow | null>(null);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [executionData, setExecutionData] = useState({
    recipient_type: 'single',
    contact_id: '',
    program_name: '',
    instructor_name: '',
    start_date: '',
    certification_name: '',
    certificate_url: '',
    achievement_date: ''
  });

  const queryClient = useQueryClient();

  // Fetch recent contacts for workflow execution
  const { data: recentContacts = [] } = useQuery({
    queryKey: ['recent-contacts'],
    queryFn: () => UnifiedCRMService.getContacts({ limit: 20 })
  });

  // Fetch recent leads
  const { data: recentLeads = [] } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => UnifiedCRMService.getLeads({ limit: 20 })
  });

  // Fetch real email campaign metrics
  const { data: campaignMetrics } = useQuery({
    queryKey: ['email-campaign-metrics'],
    queryFn: async () => {
      try {
        const campaigns = await EmailCampaignService.getEmailCampaigns();
        const today = new Date().toDateString();
        
        // Calculate real metrics from campaigns
        const todaysCampaigns = campaigns.filter(c =>
          c.created_at && new Date(c.created_at).toDateString() === today
        );
        
        const totalSent = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
        const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
        const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
        
        const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
        const automationSuccess = campaigns.length > 0 ?
          Math.round((campaigns.filter(c => c.status === 'sent').length / campaigns.length) * 100) : 0;

        return {
          emailsSentToday: todaysCampaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0),
          openRate,
          automationSuccess,
          totalCampaigns: campaigns.length
        };
      } catch (error) {
        console.error('Error fetching campaign metrics:', error);
        return {
          emailsSentToday: 0,
          openRate: 0,
          automationSuccess: 0,
          totalCampaigns: 0
        };
      }
    }
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const { workflow, executionData } = data;
      
      switch (workflow.id) {
        case 'welcome-sequence':
          return await EnhancedEmailCampaignService.sendWelcomeEmail(executionData.contact_id);
          
        case 'training-promotion':
          return await EnhancedEmailCampaignService.sendTrainingPromotion(
            executionData.contact_id,
            {
              program_name: executionData.program_name,
              start_date: executionData.start_date,
              benefits: ['Industry Recognition', 'Career Advancement', 'Expert Instruction'],
              instructor_name: executionData.instructor_name
            }
          );
          
        case 'certification-achievement':
          return await EnhancedEmailCampaignService.sendCertificationAchievement(
            executionData.contact_id,
            {
              certification_name: executionData.certification_name,
              certificate_url: executionData.certificate_url,
              achievement_date: executionData.achievement_date
            }
          );
          
        default:
          throw new Error('Unknown workflow');
      }
    },
    onSuccess: () => {
      toast.success('Professional email sent successfully!');
      setShowExecuteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
    }
  });

  // Test Resend connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => ResendEmailService.testConnection(),
    onSuccess: (isConnected) => {
      if (isConnected) {
        toast.success('Resend API connection successful!');
      } else {
        toast.error('Resend API connection failed');
      }
    },
    onError: () => {
      toast.error('Failed to test Resend API connection');
    }
  });

  const handleExecuteWorkflow = (workflow: EmailWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowExecuteDialog(true);
  };

  const handleSendEmail = () => {
    if (!selectedWorkflow || !executionData.contact_id) {
      toast.error('Please select a recipient');
      return;
    }

    executeWorkflowMutation.mutate({
      workflow: selectedWorkflow,
      executionData
    });
  };

  const getWorkflowIcon = (workflow: EmailWorkflow) => {
    const Icon = workflow.icon;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      onboarding: 'bg-blue-100 text-blue-800',
      marketing: 'bg-green-100 text-green-800',
      achievement: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Professional Email Workflows
          </h1>
          <p className="text-muted-foreground">
            Automated professional email workflows with Resend API integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
          >
            {testConnectionMutation.isPending ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Test Resend API
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Email Workflows</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {EMAIL_WORKFLOWS.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                        {getWorkflowIcon(workflow)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {workflow.name}
                          {getCategoryBadge(workflow.category)}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {workflow.automation_enabled && (
                        <Badge variant="outline" className="text-green-600">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      <Button
                        onClick={() => handleExecuteWorkflow(workflow)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Execute
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Template: {workflow.template_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Category: {workflow.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Configure automated email workflows based on CRM events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">New Contact Welcome</h4>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically send welcome email when new contact is created
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Trigger: Contact Created</span>
                    <span>•</span>
                    <span>Template: Professional Welcome</span>
                    <span>•</span>
                    <span>Delay: Immediate</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Lead Qualification Follow-up</h4>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send training program promotion to qualified leads
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Trigger: Lead Status = Qualified</span>
                    <span>•</span>
                    <span>Template: Training Promotion</span>
                    <span>•</span>
                    <span>Delay: 1 hour</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Certification Celebration</h4>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Celebrate certification achievements automatically
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Trigger: Certification Completed</span>
                    <span>•</span>
                    <span>Template: Achievement</span>
                    <span>•</span>
                    <span>Delay: Immediate</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignMetrics?.emailsSentToday || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Real-time data from campaigns
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignMetrics?.openRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Calculated from real campaigns
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automation Success</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignMetrics?.automationSuccess || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Based on campaign completion rates
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Performance metrics for each email workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {EMAIL_WORKFLOWS.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getWorkflowIcon(workflow)}
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-sm text-muted-foreground">{workflow.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">12</p>
                        <p className="text-muted-foreground">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">75%</p>
                        <p className="text-muted-foreground">Open Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">45%</p>
                        <p className="text-muted-foreground">Click Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Execute Workflow Dialog */}
      <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedWorkflow && getWorkflowIcon(selectedWorkflow)}
              Execute {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>
              Configure and send professional email using Resend API
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Select Recipient</Label>
              <Select
                value={executionData.contact_id}
                onValueChange={(value) => setExecutionData(prev => ({ ...prev, contact_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact or lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts-header" disabled>Recent Contacts</SelectItem>
                  {recentContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </SelectItem>
                  ))}
                  <SelectItem value="leads-header" disabled>Recent Leads</SelectItem>
                  {recentLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name} ({lead.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workflow-specific fields */}
            {selectedWorkflow?.id === 'training-promotion' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Name</Label>
                  <Input
                    value={executionData.program_name}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, program_name: e.target.value }))}
                    placeholder="Advanced Leadership Development"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructor Name</Label>
                  <Input
                    value={executionData.instructor_name}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, instructor_name: e.target.value }))}
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={executionData.start_date}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {selectedWorkflow?.id === 'certification-achievement' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certification Name</Label>
                  <Input
                    value={executionData.certification_name}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, certification_name: e.target.value }))}
                    placeholder="Professional Project Management"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Certificate URL</Label>
                  <Input
                    value={executionData.certificate_url}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, certificate_url: e.target.value }))}
                    placeholder="https://certificates.company.com/cert123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Achievement Date</Label>
                  <Input
                    type="date"
                    value={executionData.achievement_date}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, achievement_date: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!executionData.contact_id || executeWorkflowMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {executeWorkflowMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Professional Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}