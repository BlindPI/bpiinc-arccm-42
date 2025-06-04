import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Mail,
  Plus,
  BarChart3,
  FileText,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Zap
} from 'lucide-react';
import { CampaignWizard } from '@/components/crm/campaigns/CampaignWizard';
import { TemplateManager } from '@/components/crm/campaigns/TemplateManager';
import { CampaignAnalytics } from '@/components/crm/campaigns/CampaignAnalytics';
import { CRMLayout } from '@/components/crm/layout/CRMLayout';

export function CRMEmailCampaignsPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleCampaignSuccess = (campaign: any) => {
    setIsWizardOpen(false);
    setActiveTab('campaigns');
    // Could show success toast here
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="text-gray-600">Create, manage, and analyze your email marketing campaigns</p>
          </div>
          <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new email campaign with our step-by-step wizard
                </DialogDescription>
              </DialogHeader>
              <CampaignWizard 
                onSuccess={handleCampaignSuccess}
                onCancel={() => setIsWizardOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-xs text-green-600 mt-1">+3 this month</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">8,547</p>
                  <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">28.5%</p>
                  <p className="text-xs text-green-600 mt-1">+2.3% vs industry</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                  <p className="text-2xl font-bold text-gray-900">$24,580</p>
                  <p className="text-xs text-green-600 mt-1">+18% vs last month</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignAnalytics showSummary={true} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManager 
              onSelectTemplate={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <CampaignAnalytics showSummary={false} />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to help you manage your email campaigns effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setIsWizardOpen(true)}
              >
                <Plus className="h-6 w-6" />
                <span className="font-medium">Create Campaign</span>
                <span className="text-xs text-gray-500">Start a new email campaign</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('templates')}
              >
                <FileText className="h-6 w-6" />
                <span className="font-medium">Manage Templates</span>
                <span className="text-xs text-gray-500">Create and edit email templates</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="font-medium">View Analytics</span>
                <span className="text-xs text-gray-500">Analyze campaign performance</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span className="font-medium">Schedule Campaigns</span>
                <span className="text-xs text-gray-500">Manage scheduled sends</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Email Marketing Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Subject Line Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Keep it under 50 characters for mobile optimization</li>
                  <li>• Use personalization tokens like {`{{first_name}}`}</li>
                  <li>• Create urgency without being spammy</li>
                  <li>• A/B test different approaches</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Content Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Focus on value for the recipient</li>
                  <li>• Use clear, actionable call-to-action buttons</li>
                  <li>• Optimize for mobile devices</li>
                  <li>• Include unsubscribe links</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}