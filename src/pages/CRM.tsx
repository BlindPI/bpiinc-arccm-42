import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnhancedLeadsTable } from '@/components/crm/enhanced/EnhancedLeadsTable';
import { LeadScoringDashboard } from '@/components/crm/analytics/LeadScoringDashboard';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { AccountsTable } from '@/components/crm/accounts/AccountsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { RevenueMetricsDashboard } from '@/components/crm/RevenueMetricsDashboard';
import { CampaignWizard } from '@/components/crm/campaigns/CampaignWizard';
import { CampaignAnalyticsDashboard } from '@/components/crm/campaigns/CampaignAnalyticsDashboard';
import { NurturingCampaignBuilder } from '@/components/crm/campaigns/NurturingCampaignBuilder';
import { EmailCampaignBuilder } from '@/components/crm/campaigns/EmailCampaignBuilder';
import { WorkflowDashboard } from '@/components/crm/automation/WorkflowDashboard';
import { AssignmentRulesManager } from '@/components/crm/automation/AssignmentRulesManager';
import { ProductionReadiness } from '@/components/crm/ProductionReadiness';
import { useCRMContacts } from '@/hooks/useCRMContacts';
import { Plus, Mail, Target, BarChart3, Settings, Workflow, Database } from 'lucide-react';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [showNurturingBuilder, setShowNurturingBuilder] = useState(false);
  const [showEmailBuilder, setShowEmailBuilder] = useState(false);
  const [showWorkflowManager, setShowWorkflowManager] = useState(false);
  const [showAssignmentRules, setShowAssignmentRules] = useState(false);
  const [showProductionSetup, setShowProductionSetup] = useState(false);
  const contactsProps = useCRMContacts();

  const handleCampaignComplete = (campaign: any) => {
    setShowCampaignWizard(false);
    setShowNurturingBuilder(false);
    setShowEmailBuilder(false);
    setActiveTab('campaigns');
  };

  if (showCampaignWizard) {
    return (
      <div className="container mx-auto p-6">
        <CampaignWizard
          onComplete={handleCampaignComplete}
          onCancel={() => setShowCampaignWizard(false)}
        />
      </div>
    );
  }

  if (showNurturingBuilder) {
    return (
      <div className="container mx-auto p-6">
        <NurturingCampaignBuilder
          onComplete={handleCampaignComplete}
          onCancel={() => setShowNurturingBuilder(false)}
        />
      </div>
    );
  }

  if (showEmailBuilder) {
    return (
      <div className="container mx-auto p-6">
        <EmailCampaignBuilder
          onSave={handleCampaignComplete}
          onCancel={() => setShowEmailBuilder(false)}
        />
      </div>
    );
  }

  if (showWorkflowManager) {
    return (
      <div className="container mx-auto p-6">
        <WorkflowDashboard />
        <div className="mt-4">
          <Button variant="outline" onClick={() => setShowWorkflowManager(false)}>
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  if (showAssignmentRules) {
    return (
      <div className="container mx-auto p-6">
        <AssignmentRulesManager />
        <div className="mt-4">
          <Button variant="outline" onClick={() => setShowAssignmentRules(false)}>
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  if (showProductionSetup) {
    return (
      <div className="container mx-auto p-6">
        <ProductionReadiness />
        <div className="mt-4">
          <Button variant="outline" onClick={() => setShowProductionSetup(false)}>
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
          <p className="text-muted-foreground">
            AI-powered CRM with automated lead scoring, intelligent assignment, and real-time analytics
          </p>
        </div>
        <Button onClick={() => setShowProductionSetup(true)} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          Production Setup
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Enhanced Leads</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RevenueMetricsDashboard />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <EnhancedLeadsTable />
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <LeadScoringDashboard />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Manage opportunities through different stages of the sales process</CardDescription>
            </CardHeader>
            <CardContent>
              <OpportunityPipeline />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Campaign Management</h2>
              <p className="text-muted-foreground">
                Create, manage, and analyze email campaigns and lead nurturing sequences
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowEmailBuilder(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Quick Email
              </Button>
              <Button onClick={() => setShowNurturingBuilder(true)}>
                <Target className="h-4 w-4 mr-2" />
                Nurturing Campaign
              </Button>
              <Button onClick={() => setShowCampaignWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Campaign Wizard
              </Button>
            </div>
          </div>
          
          <CampaignAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Workflow Automation</h2>
              <p className="text-muted-foreground">
                Automate lead processing with intelligent workflows and performance tracking
              </p>
            </div>
            <Button onClick={() => setShowWorkflowManager(true)}>
              <Workflow className="h-4 w-4 mr-2" />
              Open Workflow Manager
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Workflow Management</h3>
              <p className="text-muted-foreground mb-4">
                Access the full workflow management interface to create, configure, and monitor automated lead workflows
              </p>
              <Button onClick={() => setShowWorkflowManager(true)}>
                Launch Workflow Manager
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Assignment Management</h2>
              <p className="text-muted-foreground">
                Configure intelligent lead assignment rules and monitor team performance
              </p>
            </div>
            <Button onClick={() => setShowAssignmentRules(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Assignment Rules
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Assignment Rules Configuration</h3>
              <p className="text-muted-foreground mb-4">
                Set up intelligent assignment rules, monitor team workloads, and optimize lead distribution
              </p>
              <Button onClick={() => setShowAssignmentRules(true)}>
                Configure Assignment Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>Manage customer contacts and communication preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactsTable {...contactsProps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage customer accounts and organizational relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Management</CardTitle>
              <CardDescription>Track all customer interactions and follow-up tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivitiesTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
