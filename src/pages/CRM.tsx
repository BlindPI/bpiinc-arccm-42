import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
  Building2,
  Target,
  Mail,
  Phone
} from 'lucide-react';
import { CRMService } from '@/services/crm/crmService';
import type { Lead, Contact, Account, Opportunity, Activity as ActivityType, CRMStats } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { ExecutiveDashboard } from '@/components/crm/analytics/ExecutiveDashboard';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data queries
  const { data: crmStats, isLoading: statsLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => CRMService.getCRMStats()
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => CRMService.getLeads()
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => CRMService.getOpportunities()
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => CRMService.getActivities()
  });

  const isLoading = statsLoading || leadsLoading || contactsLoading || opportunitiesLoading || activitiesLoading;

  // Recent items for dashboard
  const recentLeads = leads?.slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 5) || [];
  const recentOpportunities = opportunities?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading CRM data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
          <p className="text-muted-foreground">
            Manage leads, contacts, and opportunities in one place
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Quick Add Lead
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="opportunities">Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.total_leads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active prospects in pipeline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.total_opportunities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Open sales opportunities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(crmStats?.total_pipeline_value || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total opportunity value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.total_activities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Recent interactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest prospects added to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company_name || 'No company'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={lead.lead_status === 'new' ? 'default' : 'secondary'}
                        >
                          {lead.lead_status.charAt(0).toUpperCase() + lead.lead_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {recentLeads.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No recent leads
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Hot Opportunities</CardTitle>
                <CardDescription>High-value deals in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">
                          {opportunity.opportunity_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(opportunity.estimated_value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {opportunity.probability}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {recentOpportunities.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No recent opportunities
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest interactions and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                      <p className="font-medium">{activity.subject}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={activity.completed ? 'default' : 'secondary'}>
                      {activity.completed ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                
                {recentActivities.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No recent activities
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <LeadsTable />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <ContactsTable />
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <OpportunityPipeline />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivitiesTable />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <ExecutiveDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
