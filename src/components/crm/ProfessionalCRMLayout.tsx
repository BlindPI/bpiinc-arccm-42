
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Target, 
  Activity,
  BarChart3,
  Settings,
  Search,
  Plus
} from 'lucide-react';

// Import existing components
import { CRMStatsCards } from './dashboard/CRMStatsCards';
import { LeadsListView } from './leads/LeadsListView';
import { ContactsListView } from './contacts/ContactsListView';
import { AccountsListView } from './accounts/AccountsListView';
import { OpportunitiesListView } from './opportunities/OpportunitiesListView';
import { CRMGlobalSearch } from './search/CRMGlobalSearch';
import { RealTimeCRMDashboard } from './dashboard/RealTimeCRMDashboard';

export function ProfessionalCRMLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Customer Relationship Management</h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive CRM platform with real-time insights and automation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CRMGlobalSearch />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Content */}
          <TabsContent value="dashboard">
            <RealTimeCRMDashboard />
          </TabsContent>

          {/* Leads Content */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lead Management
                    </CardTitle>
                    <CardDescription>
                      Manage and track your sales leads with comprehensive scoring and pipeline management
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <LeadsListView />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Content */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Management
                    </CardTitle>
                    <CardDescription>
                      Centralized contact database with relationship tracking and communication history
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ContactsListView />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Content */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Account Management
                    </CardTitle>
                    <CardDescription>
                      Manage customer accounts, track relationships, and monitor account health
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AccountsListView />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Content */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Opportunities Pipeline
                    </CardTitle>
                    <CardDescription>
                      Track and manage your sales opportunities through the complete sales cycle
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <OpportunitiesListView />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Content */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  CRM Analytics
                </CardTitle>
                <CardDescription>
                  Advanced analytics and insights for data-driven decision making
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    Visit the dedicated Analytics page for comprehensive reports and insights
                  </p>
                  <Button onClick={() => window.location.href = '/crm/analytics'}>
                    View Analytics Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
