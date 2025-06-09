
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRMOverviewDashboard } from '@/components/crm/CRMOverviewDashboard';
import { EnhancedLeadsTable } from '@/components/crm/enhanced/EnhancedLeadsTable';
import { LeadScoringDashboard } from '@/components/crm/analytics/LeadScoringDashboard';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { AccountsTable } from '@/components/crm/accounts/AccountsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { CampaignDashboard } from '@/components/crm/campaigns/CampaignDashboard';
import { useCRMContacts } from '@/hooks/useCRMContacts';
import { useRealtimeCRMData } from '@/hooks/useRealtimeCRMData';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('overview');
  const contactsProps = useCRMContacts();
  
  // Enable real-time data updates
  useRealtimeCRMData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
          <p className="text-muted-foreground">
            AI-powered CRM with automated lead scoring, intelligent assignment, and real-time analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Enhanced Leads</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CRMOverviewDashboard />
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

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
