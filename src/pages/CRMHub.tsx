import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Activity, 
  Building2,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  BarChart3,
  Plus,
  UserPlus,
  PhoneCall,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Import CRM components
import { LeadsTable } from '@/components/crm/LeadsTable';
import { ContactsTable } from '@/components/crm/contacts/ContactsTable';
import { ActivitiesTable } from '@/components/crm/ActivitiesTable';
import { OpportunityPipeline } from '@/components/crm/OpportunityPipeline';
import { AccountsTable } from '@/components/crm/accounts/AccountsTable';
import { useCRMContacts } from '@/hooks/useCRMContacts';

export default function CRMHub() {
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState('leads');
  const contactsProps = useCRMContacts();

  // Role-based access control
  const hasEnterpriseAccess = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);
  const hasCRMAccess = profile?.role && ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'].includes(profile.role);

  if (!hasCRMAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">CRM Access Required</h3>
              <p className="text-gray-500">You need CRM access permissions to view this hub.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tab configuration with role-based visibility
  const tabs = [
    {
      id: 'leads',
      title: 'Lead Management',
      description: 'Sales leads with scoring and pipeline',
      icon: Target,
      visible: hasCRMAccess
    },
    {
      id: 'contacts',
      title: 'Contact Management',
      description: 'Customer contacts and profiles',
      icon: Users,
      visible: hasCRMAccess
    },
    {
      id: 'accounts',
      title: 'Account Management',
      description: 'Customer accounts and business relationships',
      icon: Building2,
      visible: hasCRMAccess
    },
    {
      id: 'opportunities',
      title: 'Opportunities Pipeline',
      description: 'Sales opportunities tracking',
      icon: TrendingUp,
      visible: hasCRMAccess
    },
    {
      id: 'activities',
      title: 'Activities Management',
      description: 'Tasks, calls, and meetings',
      icon: Activity,
      visible: hasCRMAccess
    }
  ].filter(tab => tab.visible);

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">CRM Management Hub</h1>
            {hasEnterpriseAccess && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Enterprise
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Comprehensive customer relationship management with leads, contacts, opportunities, and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
          <Button size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            CRM Analytics
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Opportunities</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Activities</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main CRM Hub Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.title.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Lead Management Tab */}
        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Lead Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage and track your sales leads with comprehensive scoring and pipeline management
                  </p>
                </div>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LeadsTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Management Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Contact Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage customer contacts with comprehensive profiles, communication preferences, and interaction history tracking
                  </p>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ContactsTable {...contactsProps} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Management Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Account Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage customer accounts, prospects, and business relationships with comprehensive account profiles and analytics
                  </p>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AccountsTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Pipeline Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Opportunities Pipeline
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track and manage your sales opportunities through the complete sales cycle
                  </p>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opportunity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <OpportunityPipeline />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Management Tab */}
        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Activities Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track tasks, calls, meetings, and other customer interactions with comprehensive activity management
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivitiesTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">CRM Quick Actions</h3>
              <p className="text-sm text-gray-600">
                Access frequently used CRM features and integrations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email Campaign
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}