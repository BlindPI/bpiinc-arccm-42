
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { AccountsTable } from '@/components/crm/accounts/AccountsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { RevenueMetricsDashboard } from '@/components/crm/RevenueMetricsDashboard';
import { CRMDebugPanel } from '@/components/debug/CRMDebugPanel';
import { useCRMContacts } from '@/hooks/useCRMContacts';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('overview');
  const contactsProps = useCRMContacts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
          <p className="text-muted-foreground">
            Comprehensive CRM system for managing leads, opportunities, contacts, and revenue analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RevenueMetricsDashboard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Overview</CardTitle>
                <CardDescription>Current opportunities in the sales pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunityPipeline />
              </CardContent>
            </Card>
            <CRMDebugPanel />
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Track and manage potential customers through the sales funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsTable />
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
}
